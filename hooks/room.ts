import { initialize, Room, State, Participant, Stream } from '@telnyx/video';
import { useEffect, useRef, useState, useContext, useMemo } from 'react';
import { DebugContext } from '../contexts/DebugContext';

const TOKEN_TTL = 50;

interface Props {
  roomId: string;
  tokens: {
    clientToken: string;
    refreshToken: string;
  };
  context: {};
}

export type TelnyxRoom = State & {
  localParticipantId: Room['localParticipantId'];
  presenter?: Participant;
  participantsByActivity: ReadonlySet<Participant['id']>;
  publishStream: Room['publishStream'];
  unpublishStream: Room['unpublishStream'];
  getLocalParticipant: Room['getLocalParticipant'];
  getParticipantStream: Room['getParticipantStream'];
  getParticipantStreams: Room['getParticipantStreams'];
  disconnect: Room['disconnect'];
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
}: Props): TelnyxRoom | undefined => {
  const [_, setDebugState] = useContext(DebugContext);
  const roomRef = useRef<Room>();
  const [state, setState] = useState<State>();
  const [clientToken, setClientToken] = useState<string>(tokens.clientToken);

  const [presenter, setPresenter] = useState<Participant>();
  const [participantsByActivity, setParticipantsByActivity] = useState<
    ReadonlySet<Participant['id']>
  >(new Set());

  const onConnected = () => {
    setParticipantsByActivity(new Set());
  };

  const onDisconnected = () => {
    setParticipantsByActivity(new Set());
  };

  const connectAndJoinRoom = async () => {
    if (!roomRef.current) {
      roomRef.current = await initialize({
        roomId,
        clientToken,
        context: JSON.stringify(context),
      });

      setState(roomRef.current.state);

      roomRef.current.on('connected', onConnected);
      roomRef.current.on('disconnected', onDisconnected);
      roomRef.current.on('state_changed', setState);
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
    if (state?.status === 'disconnected') {
      connectAndJoinRoom();
    }
  }, [state?.status]);

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
        ...state,
        localParticipantId: roomRef.current.localParticipantId,
        presenter,
        participantsByActivity,
        publishStream: roomRef.current.publishStream,
        unpublishStream: roomRef.current.unpublishStream,
        getLocalParticipant: roomRef.current.getLocalParticipant,
        getParticipantStream: roomRef.current.getParticipantStream,
        getParticipantStreams: roomRef.current.getParticipantStreams,
        disconnect: roomRef.current.disconnect,
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
