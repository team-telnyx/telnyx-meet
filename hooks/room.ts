import {
  createPublisher,
  Participant,
  Room,
  State,
  Stream,
} from '@telnyx/video';
import { useEffect, useRef, useState, useContext, useMemo } from 'react';
import { DebugContext } from '../contexts/DebugContext';

const TOKEN_TTL = 50;
const useAudioMixer = false;

const createRoom = ({
  roomId,
  clientToken,
  context,
}: {
  roomId: string;
  clientToken: string;
  context: {};
}) => {
  // @ts-ignore
  window.__telnyx_video_log_level__ = 'INFO';

  return new Room(roomId, {
    clientToken,
    useAudioMixer,
    publisher: createPublisher({
      context: JSON.stringify(context),
    }),
  });
};

interface Props {
  roomId: string;
  tokens: {
    clientToken: string;
    refreshToken: string;
  };
  context: {};
}

export interface TelnyxRoom {
  readonly state: State;
  readonly participantsByActivity: Set<string>;
  readonly presenter?: Participant;
  readonly publish: Room['publish'];
  readonly unpublish: Room['unpublish'];
  readonly disconnect: Room['disconnect'];
  isReady: (participantId: Participant['id'], key: string) => boolean;
  getParticipantStream: (
    participantId: Participant['id'],
    key: string
  ) => Stream | undefined;
  getStatsForParticipantStream: Room['getStatsForParticipantStream'];
}

export const useRoom = ({ roomId, tokens, context }: Props): TelnyxRoom => {
  const [_, setDebugState] = useContext(DebugContext);

  const roomRef = useRef<Room>(
    createRoom({ roomId, clientToken: tokens.clientToken, context })
  );
  const [clientToken, setClientToken] = useState<string>(tokens.clientToken);
  const [state, setState] = useState<State>(roomRef.current.state);
  const [presenter, setPresenter] = useState<Participant>();
  const [participantsByActivity, setParticipantsByActivity] = useState<
    Set<string>
  >(new Set());

  roomRef.current.updateClientToken(clientToken);

  const onStateChanged = (state: State) => {
    setState(state);
  };

  const onConnected = (state: State) => {
    setParticipantsByActivity(new Set());
  };

  const onDisconnected = (state: State) => {
    setParticipantsByActivity(new Set());
  };

  const onStreamAdded = (
    { participantId, key }: { participantId: Participant['id']; key: string },
    state: State
  ) => {
    const participant = state.participants[participantId];
    const stream = state.streams[participant.streams[key].streamId];
    if (participant.isRemote) {
      if (useAudioMixer && stream.videoEnabled) {
        roomRef.current.subscribe(participantId, key, {
          audio: false,
          video: true,
        });
      }

      if (!useAudioMixer && (stream.audioEnabled || stream.videoEnabled)) {
        roomRef.current.subscribe(participantId, key, {
          audio: true,
          video: true,
        });
      }
    }
  };

  const onParticipantJoined = ({
    participantId,
  }: {
    participantId: Participant['id'];
  }) => {
    participantsByActivity.add(participantId);
    setParticipantsByActivity(new Set([...participantsByActivity]));
  };

  const onParticipantLeft = ({
    participantId,
  }: {
    participantId: Participant['id'];
  }) => {
    participantsByActivity.delete(participantId);
    setParticipantsByActivity(new Set([...participantsByActivity]));
  };

  const onParticipantSpeaking = ({
    participantId,
    key,
  }: {
    participantId: Participant['id'];
    key: string;
  }) => {
    if (key !== 'self') {
      return;
    }

    participantsByActivity.delete(participantId);
    setParticipantsByActivity(
      new Set([participantId, ...participantsByActivity])
    );
  };

  const isReady = useMemo(() => {
    return (participantId: Participant['id'], key: string): boolean => {
      if (participantId === state.publisher.participantId) {
        if (!state.publisher.streamsPublished[key]) {
          // since no stream exists with the key we return true
          return true;
        }

        return state.publisher.streamsPublished[key]?.status === 'published';
      }

      if (!state.subscriptions[participantId]?.[key]) {
        // since no subscription exists with for the participant stream we return true
        return true;
      }

      return state.subscriptions[participantId]?.[key]?.status === 'started';
    };
  }, [state.subscriptions, state.publisher]);

  const isSubscribed = useMemo(() => {
    return (participantId: Participant['id'], key: string): boolean => {
      return state.subscriptions[participantId]?.[key]?.status === 'started';
    };
  }, [state.subscriptions]);

  const isPublished = useMemo(() => {
    return (key: string): boolean => {
      return state.publisher.streamsPublished[key]?.status === 'published';
    };
  }, [state.publisher]);

  const getParticipantStream = useMemo(() => {
    return (
      participantId: Participant['id'],
      key: string
    ): Stream | undefined => {
      const streamId =
        state.participants[participantId]?.streams[key]?.streamId;
      if (!streamId) {
        return undefined;
      }

      return state.streams[streamId];
    };
  }, [state.streams]);

  useEffect(() => {
    // for 1000 participants it might take about 2ms to resolve the presenterId
    const presenterId = Object.keys(state.participants).find(
      (participantId) => {
        const participant = state.participants[participantId];

        return participant.streams['presentation'];
      }
    );

    setPresenter(presenterId ? state.participants[presenterId] : undefined);
  }, [state.participants]);

  useEffect(() => {
    const refreshTokenIntervalId = setInterval(async () => {
      if (roomRef.current?.state.status !== 'connected') {
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
  }, [tokens.refreshToken, roomRef.current?.state.status]);

  useEffect(() => {
    setDebugState(state);
    console.debug('[video-meet] React State: ', state);
  }, [state]);

  useEffect(() => {
    if (roomRef.current.state.status === 'connected') {
      return;
    }

    roomRef.current.on('state_changed', onStateChanged);
    roomRef.current.on('connected', onConnected);
    roomRef.current.on('disconnected', onDisconnected);
    roomRef.current.on('stream_added', onStreamAdded);
    roomRef.current.on('participant_joined', onParticipantJoined);
    roomRef.current.on('participant_left', onParticipantLeft);
    roomRef.current.on('participant_speaking', onParticipantSpeaking);
    roomRef.current.connect();

    return () => {
      roomRef.current.removeListeners();
    };
  }, []);

  return {
    state,
    participantsByActivity,
    presenter,
    publish: roomRef.current.publish.bind(roomRef.current),
    unpublish: roomRef.current.unpublish.bind(roomRef.current),
    disconnect: roomRef.current.disconnect.bind(roomRef.current),
    isReady,
    getParticipantStream,
    getStatsForParticipantStream:
      roomRef.current.getStatsForParticipantStream.bind(roomRef.current),
  };
};
