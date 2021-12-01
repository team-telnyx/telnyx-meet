import { initialize, Room, State, Participant, Stream } from '@telnyx/video';
import { useEffect, useRef, useState, useContext } from 'react';
import { DebugContext } from '../contexts/DebugContext';

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

export type TelnyxRoom = Room & {
  state: State;
  dominantSpeakerId?: Participant['id'];
  presenter?: Participant;
  participantsByActivity: ReadonlySet<Participant['id']>;
  isReady: (participantId: Participant['id'], key: Stream['key']) => boolean;
  getStatsForParticipantStream: (
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
  const roomRef = useRef<Room>();
  const [state, setState] = useState<State>();
  const [clientToken, setClientToken] = useState<string>(tokens.clientToken);

  const [presenter, setPresenter] = useState<Participant>();
  const [participantsByActivity, setParticipantsByActivity] = useState<
    Set<Participant['id']>
  >(new Set());
  const [dominantSpeakerId, setDominantSpeakerId] =
    useState<Participant['id']>();

  const connectAndJoinRoom = async () => {
    if (!roomRef.current) {
      roomRef.current = await initialize({
        roomId,
        clientToken,
        context: JSON.stringify(context),
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

        if (participantId === roomRef.current?.getLocalParticipant().id) {
          return;
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
      roomRef.current.on('audio_activity', (participantId, key, state) => {
        if (
          key === 'self' &&
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
    }

    roomRef.current.connect();
  };

  useEffect(() => {
    // @ts-ignore
    window.__telnyx_video_log_level__ = 'DEBUG';

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
        isReady: (participantId, key) => false,
        getStatsForParticipantStream: async (participantId, key) => {
          return {
            senders: { audio: undefined, video: undefined },
            receivers: { audio: undefined, video: undefined },
          };
        },
      }
    : undefined;
};
