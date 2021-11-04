import React, { useState, useEffect } from 'react';
import { Box, Text } from 'grommet';
import Feeds from './Feeds';
import RoomInfo from './RoomInfo';
import RoomControls from './RoomControls';
import ParticipantsList from './ParticipantsList';

import { useRoom } from '../hooks/room';
import RoomAudio from './RoomAudio';

function Room({
  roomId,
  tokens,
  context,
  onDisconnected,
}: {
  roomId: string;
  tokens: {
    clientToken: string;
    refreshToken: string;
  };
  context: {
    id: number;
    username: string;
  };
  onDisconnected: () => void;
}) {
  const [isParticipantsListVisible, setIsParticipantsListVisible] =
    useState<boolean>(false);
  const [audioOutputDeviceId, setAudioOutputDeviceId] = useState<string>();

  const room = useRoom({
    roomId,
    tokens,
    context,
  });

  useEffect(() => {
    if (room.state.status === 'disconnected') {
      onDisconnected();
    }
  }, [room.state.status]);

  return (
    <Box fill background='#1b1b1b' overflow='hidden'>
      <RoomInfo roomId={roomId} />

      <Box direction='row' flex>
        <Box
          flex
          id='room-container'
          style={{ position: 'relative', margin: '16px' }}
        >
          {room.state.status === 'connecting' && (
            <Box align='center' justify='center' fill>
              <Text
                data-testid='loading-joining-room'
                size='xxlarge'
                color='status-disabled'
              >
                Joining room...
              </Text>
            </Box>
          )}

          {room.state.status === 'disconnecting' && (
            <Box align='center' justify='center' fill>
              <Text
                data-testid='loading-leaving-room'
                size='xxlarge'
                color='status-disabled'
              >
                Leaving room...
              </Text>
            </Box>
          )}

          {room.state.status === 'connected' && (
            <Feeds
              dataTestId='feeds'
              participants={room.state.participants}
              participantsByActivity={room.participantsByActivity}
              presenter={room.presenter}
              isReady={room.isReady}
              getParticipantStream={room.getParticipantStream}
              audioOutputDeviceId={audioOutputDeviceId}
              getStatsForParticipantStream={room.getStatsForParticipantStream}
            />
          )}
        </Box>

        {room.state.status === 'connected' && isParticipantsListVisible && (
          <Box width='medium' fill='vertical'>
            <ParticipantsList
              publisher={room.state.publisher}
              participants={room.state.participants}
              getParticipantStream={room.getParticipantStream}
              onChangeParticipantsListVisible={setIsParticipantsListVisible}
            />
          </Box>
        )}
      </Box>
      {room.state.status === 'connected' && (
        <>
          <RoomControls
            isParticipantsListVisible={isParticipantsListVisible}
            onChangeParticipantsListVisible={setIsParticipantsListVisible}
            room={room}
            disableScreenshare={
              room.presenter
                ? room.presenter.id !== room.state.publisher.participantId
                : false
            }
            onAudioOutputDeviceChange={setAudioOutputDeviceId}
          />
          <RoomAudio
            participants={room.state.participants}
            publisher={room.state.publisher}
            streams={room.state.streams}
            useAudioMixer={room.state.audioMixer.isEnabled}
            mixedAudioTrack={room.state.audioMixer.track}
            audioOutputDeviceId={audioOutputDeviceId}
          />
        </>
      )}
    </Box>
  );
}

export default Room;
