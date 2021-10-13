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
  readonly presenter?: Participant;
  readonly publish: Room['publish'];
  readonly unpublish: Room['unpublish'];
  readonly disconnect: Room['disconnect'];
  isPublished: (key: string) => boolean;
  isSubscribed: (participantId: Participant['id'], key: string) => boolean;
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
  //@ts-ignore
  const [state, setState] = useState<State>(roomRef.current.state);
  const [presenter, setPresenter] = useState<Participant>();

  roomRef.current.updateClientToken(clientToken);

  const onStateChanged = (state: State) => {
    setState(state);
  };

  const onStreamAdded = (
    { participantId, key }: { participantId: Participant['id']; key: string },
    state: State
  ) => {
    if (state.participants[participantId].isRemote) {
      roomRef.current.subscribe(participantId, key, {
        audio: true,
        video: true,
      });
    }
  };

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
    roomRef.current.on('stream_added', onStreamAdded);
    roomRef.current.connect();

    return () => {
      roomRef.current.removeListeners();
    };
  }, []);

  return {
    state,
    presenter,
    publish: roomRef.current.publish.bind(roomRef.current),
    unpublish: roomRef.current.unpublish.bind(roomRef.current),
    disconnect: roomRef.current.disconnect.bind(roomRef.current),
    isSubscribed,
    isPublished,
    getParticipantStream,
    getStatsForParticipantStream:
      roomRef.current.getStatsForParticipantStream.bind(roomRef.current),
  };
};
