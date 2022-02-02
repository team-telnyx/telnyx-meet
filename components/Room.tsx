import React, { useState } from 'react';
import { Box, Text } from 'grommet';
import { useRoom } from 'hooks/room';

import Feeds from 'components/Feeds';
import RoomInfo from 'components/RoomInfo';
import RoomControls from 'components/RoomControls';
import ParticipantsList from 'components/ParticipantsList';
import RoomAudio from 'components/RoomAudio';

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
    callbacks: {
      onDisconnected,
    },
  });

  if (!room) {
    return (
      <Box fill background='#1b1b1b' overflow='hidden'>
        <RoomInfo roomId={roomId} />

        <Box direction='row' flex>
          <Box
            flex
            id='room-container'
            style={{ position: 'relative', margin: '16px' }}
          >
            <Box align='center' justify='center' fill>
              <Text
                data-testid='loading-joining-room'
                size='xxlarge'
                color='status-disabled'
              >
                Joining room...
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  const state = room.getState();

  return (
    <Box fill background='#1b1b1b' overflow='hidden'>
      <RoomInfo roomId={roomId} />

      <Box direction='row' flex>
        <Box
          flex
          id='room-container'
          style={{ position: 'relative', margin: '16px' }}
        >
          {state.status === 'connecting' && (
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

          {state.status === 'connected' && (
            <Feeds
              dataTestId='feeds'
              participants={state.participants}
              participantsByActivity={room.participantsByActivity}
              dominantSpeakerId={room.dominantSpeakerId}
              presenter={room.presenter}
              streams={room.state.streams}
              getParticipantStream={room.getParticipantStream}
              getStatsForParticipantStream={room.getWebRTCStatsForStream}
            />
          )}
        </Box>

        {state.status === 'connected' && isParticipantsListVisible && (
          <Box width='medium' fill='vertical'>
            <ParticipantsList
              participants={state.participants}
              getParticipantStream={room.getParticipantStream}
              onChangeParticipantsListVisible={setIsParticipantsListVisible}
            />
          </Box>
        )}
      </Box>
      {state.status === 'connected' && (
        <>
          <RoomControls
            isParticipantsListVisible={isParticipantsListVisible}
            onChangeParticipantsListVisible={setIsParticipantsListVisible}
            participantsByActivity={room.participantsByActivity}
            addStream={room.addStream}
            removeStream={room.removeStream}
            updateStream={room.updateStream}
            disconnect={room.disconnect}
            streams={room.getLocalStreams()}
            disableScreenshare={
              room.presenter
                ? room.presenter.id !== room.getLocalParticipant().id
                : false
            }
            onAudioOutputDeviceChange={setAudioOutputDeviceId}
            sendMessage={room.sendMessage}
            messages={room.messages}
            getLocalParticipant={room.getLocalParticipant}
            participants={state.participants}
          />
          <RoomAudio
            useAudioMixer={true}
            participants={state.participants}
            streams={state.streams}
            mixedAudioTrack={state.mixedAudioTrack}
            audioOutputDeviceId={audioOutputDeviceId}
          />
        </>
      )}
    </Box>
  );
}

export default Room;
