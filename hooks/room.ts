import { useEffect, useRef, useState, useContext } from 'react';
import {
  initialize,
  Room,
  State,
  Participant,
  Stream,
  Message,
} from '@telnyx/video';

import { DebugContext } from 'contexts/DebugContext';
import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';

const TOKEN_TTL = 50;

interface Props {
  roomId: string;
  tokens: {
    clientToken: string;
    refreshToken: string;
  };
  context: {};
  callbacks?: {
    onConnected?: () => void;
    onDisconnected?: () => void;
  };
}

export interface Metrics {
  local: {
    participantId: string;
    audio: {
      level: number | null;
    };
    video: {
      level: number | null;
    };
  };
  remote: {
    participantId: string | null;
    audio: any;
    video: any;
  };
}

export type TelnyxRoom = Room & {
  state: State;
  dominantSpeakerId?: Participant['id'];
  presenter?: Participant;
  messages: Array<{
    from: Participant['id'];
    fromUsername: string;
    message: Message;
    recipients: Array<Participant['id']> | null;
  }>;
  connectionQualityLevel: Metrics;
  participantsByActivity: ReadonlySet<Participant['id']>;
  getWebRTCStatsForStream: (
    participantId: Participant['id'],
    key: Stream['key']
  ) => Promise<{
    senders: {
      audio?: {};
      video?: {};
    };
    receivers: {
      audio?: {};
      video?: {};
    };
  }>;
};

export const useRoom = ({
  roomId,
  tokens,
  context,
  callbacks,
}: Props): TelnyxRoom | undefined => {
  const [_, setDebugState] = useContext(DebugContext);
  const { sendNotification } = useContext(TelnyxMeetContext);
  const roomRef = useRef<Room>();
  const [state, setState] = useState<State>();
  const [clientToken, setClientToken] = useState<string>(tokens.clientToken);

  const [presenter, setPresenter] = useState<Participant>();
  const [participantsByActivity, setParticipantsByActivity] = useState<
    Set<Participant['id']>
  >(new Set());
  const [dominantSpeakerId, setDominantSpeakerId] =
    useState<Participant['id']>();

  const [messages, setMessages] = useState<TelnyxRoom['messages']>([]);
  const [connectionQualityLevel, setConnectionQualityLevel] = useState<Metrics>(
    {
      local: {
        participantId: '',
        audio: {
          level: 5,
        },
        video: {
          level: 5,
        },
      },
      remote: {
        participantId: '',
        audio: null,
        video: null,
      },
    }
  );

  const connectAndJoinRoom = async () => {
    if (!roomRef.current) {
      roomRef.current = await initialize({
        roomId,
        clientToken,
        context: JSON.stringify(context),
        logLevel: 'DEBUG',
        enableMessages: true,
        enableConnectionQualityMetrics: true,
      });

      setState(roomRef.current.getState());

      roomRef.current.on('state_changed', setState);
      roomRef.current.on('connected', (state) => {
        setParticipantsByActivity((value) => {
          return new Set([
            roomRef.current!.getLocalParticipant().id,
            ...state.participants.keys(),
          ]);
        });
        state.streams.forEach((stream) => {
          if (stream.key === 'presentation') {
            setPresenter(state.participants.get(stream.participantId));
          }

          if (
            stream.participantId === roomRef.current?.getLocalParticipant().id
          ) {
            return;
          }

          roomRef.current?.addSubscription(stream.participantId, stream.key, {
            audio: true,
            video: true,
          });
        });
        typeof callbacks?.onConnected === 'function' && callbacks.onConnected();
      });
      roomRef.current.on('disconnected', (state) => {
        setParticipantsByActivity(new Set());
        typeof callbacks?.onDisconnected === 'function' &&
          callbacks.onDisconnected();
      });
      roomRef.current.on('participant_joined', (participantId) => {
        setParticipantsByActivity((value) => {
          return new Set([
            roomRef.current!.getLocalParticipant().id,
            ...value,
            participantId,
          ]);
        });
      });
      roomRef.current.on(
        'participant_leaving',
        (participantId, reason, state) => {
          if (reason === 'kicked') {
            if (state.localParticipantId === participantId) {
              sendNotification({
                body: 'You got kicked from the room by the moderator!',
              });
            } else {
              const context = JSON.parse(
                state.participants.get(participantId).context
              );

              sendNotification({
                body: `${
                  context.username ? context.username : participantId
                } has been kicked by the moderator!`,
              });
            }
          }
        }
      );
      roomRef.current.on('participant_left', (participantId) => {
        if (presenter?.id === participantId) {
          setPresenter(undefined);
        }

        if (dominantSpeakerId === participantId) {
          setDominantSpeakerId(undefined);
        }

        setParticipantsByActivity((value) => {
          value.delete(participantId);
          return new Set([roomRef.current!.getLocalParticipant().id, ...value]);
        });
      });
      roomRef.current.on('stream_published', (participantId, key, state) => {
        if (key === 'presentation') {
          setPresenter(state.participants.get(participantId));
        }

        if (participantId === roomRef.current?.getLocalParticipant().id) {
          return;
        }

        roomRef.current?.addSubscription(participantId, key, {
          audio: true,
          video: true,
        });
      });
      roomRef.current.on('stream_unpublished', (participantId, key, state) => {
        if (key === 'presentation') {
          setPresenter(undefined);
        }

        if (dominantSpeakerId === participantId && key === 'self') {
          setDominantSpeakerId(undefined);
        }
      });
      roomRef.current.on(
        'track_enabled',
        (participantId, key, kind, state) => {}
      );
      roomRef.current.on(
        'track_disabled',
        (participantId, key, kind, state) => {}
      );
      roomRef.current.on(
        'track_censored',
        (participantId, key, kind, state) => {
          if (kind === 'audio') {
            if (state.localParticipantId === participantId) {
              sendNotification({
                body: `Your audio from "${key}" stream has been censored by the moderator`,
              });
            } else {
              const context = JSON.parse(
                state.participants.get(participantId).context
              );

              sendNotification({
                body: `${
                  context.username ? context.username : participantId
                }'s audio from "${key}" stream has been censored by the moderator`,
              });
            }
          }
        }
      );
      roomRef.current.on(
        'track_uncensored',
        (participantId, key, kind, state) => {
          if (kind === 'audio') {
            if (state.localParticipantId === participantId) {
              sendNotification({
                body: `Your audio from "${key}" stream has been uncensored by the moderator`,
              });
            } else {
              const context = JSON.parse(
                state.participants.get(participantId).context
              );

              sendNotification({
                body: `${
                  context.username ? context.username : participantId
                }'s audio from "${key}" stream has been uncensored by the moderator`,
              });
            }
          }
        }
      );
      roomRef.current.on('audio_activity', (participantId, key) => {
        if (
          key !== 'presentation' &&
          participantId !== roomRef.current?.getLocalParticipant().id
        ) {
          setDominantSpeakerId(participantId);
          setParticipantsByActivity((value) => {
            return new Set([
              roomRef.current!.getLocalParticipant().id,
              participantId,
              ...value,
            ]);
          });
        }
      });
      roomRef.current.on(
        'subscription_started',
        (participantId, key, state) => {}
      );
      roomRef.current.on(
        'subscription_reconfigured',
        (participantId, key, state) => {}
      );
      roomRef.current.on(
        'subscription_ended',
        (participantId, key, state) => {}
      );
      roomRef.current.on(
        'message_received',
        (participantId, message, recipients, state) => {
          const participant = state.participants.get(participantId);
          const fromUsername = JSON.parse(participant.context).username;

          setMessages((value) => {
            const messages = value.concat({
              from: participantId,
              fromUsername,
              message,
              recipients,
            });

            return messages;
          });
        }
      );
      roomRef.current.on(
        'connection_quality_changed',
        (participantId, connectionQualityMetrics, state) => {
          console.log(
            'connection_quality_changed',
            participantId,
            connectionQualityLevel
          );
          const metrics: Metrics = {
            local: {
              participantId: connectionQualityMetrics.local.participantId,
              audio: {
                level: connectionQualityMetrics?.local?.audio?.level,
              },
              video: {
                level: connectionQualityMetrics?.local?.video?.level,
              },
            },
            remote: {
              participantId: null,
              audio: null,
              video: null,
            },
          };
          console.log('metrics===>', metrics)
          setConnectionQualityLevel(metrics);
        }
      );
    }

    roomRef.current.connect();
  };

  useEffect(() => {
    if (!roomRef.current) {
      connectAndJoinRoom();
    }
  }, []);

  useEffect(() => {
    console.log(participantsByActivity);
  }, [participantsByActivity]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDominantSpeakerId(undefined);
    }, 5000);

    return () => {
      clearTimeout(timerId);
    };
  }, [dominantSpeakerId]);

  useEffect(() => {
    const updateClientToken = async () => {
      if (state?.status === 'connected') {
        await roomRef.current?.updateClientToken(clientToken);
      }
    };

    updateClientToken();
  }, [clientToken, state?.status]);

  useEffect(() => {
    const refreshTokenIntervalId = setInterval(async () => {
      if (state?.status !== 'connected') {
        return;
      }

      const response = await fetch('/api/refresh_client_token', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: tokens.refreshToken }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClientToken(data.token);
      }
    }, (TOKEN_TTL - 20) * 1000);

    return () => {
      clearInterval(refreshTokenIntervalId);
    };
  }, [tokens.refreshToken, state?.status]);

  useEffect(() => {
    setDebugState(state);
    console.debug('[video-meet] React State: ', state);
  }, [state]);

  return roomRef.current && state
    ? {
        ...roomRef.current,
        state,
        dominantSpeakerId,
        presenter,
        participantsByActivity,
        messages,
        connectionQualityLevel,
      }
    : undefined;
};
