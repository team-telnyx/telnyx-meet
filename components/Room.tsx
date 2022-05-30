import React, { useState, useContext, useRef } from 'react';
import { Box, Text, Button } from 'grommet';
import { State, Participant } from '@telnyx/video';

import { useRoom } from 'hooks/room';
import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';

import Feeds from 'components/Feeds';
import RoomInfo from 'components/RoomInfo';
import RoomControls from 'components/RoomControls';
import ParticipantsList from 'components/ParticipantsList';
import InviteParticipant from 'components/InviteParticipant';
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
  const { optionalFeatures, setNetworkMetrics } = useContext(TelnyxMeetContext);
  const [isParticipantsListVisible, setIsParticipantsListVisible] =
    useState<boolean>(false);
  const [isInviteParticipantVisible, setIsInviteParticipantVisible] =
    useState<boolean>(false);
  const [invitedParticipants, setInvitedParticipants] = useState<
    Map<string, boolean>
  >(new Map());

  const camera = useRef<any>();

  const onParticipantJoined = (
    participantId: Participant['id'],
    state: State
  ) => {
    const context = JSON.parse(state.participants.get(participantId).context);

    setInvitedParticipants((invitedParticipantsObject) => {
      if (invitedParticipantsObject.has(context.username)) {
        return new Map([
          ...invitedParticipantsObject,
          [context.username, true],
        ]);
      }

      return invitedParticipantsObject;
    });
  };

  const room = useRoom({
    roomId,
    tokens,
    context,
    callbacks: {
      onDisconnected,
      onParticipantJoined,
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
  const participantIds: Array<string> = [];
  state.participants.forEach((item) => {
    participantIds.push(item.id);
  });

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
            <React.Fragment>
              {optionalFeatures.isNetworkMetricsEnabled && (
                <div key='report-actions'>
                  <Button
                    color='#7D4CDB'
                    primary
                    size='small'
                    label='Start Metrics'
                    onClick={() =>
                      room.enableNetworkMetricsReport(participantIds)
                    }
                    style={{ marginRight: 4 }}
                  />

                  <Button
                    primary
                    color='#cecece'
                    size='small'
                    label='Stop Metrics'
                    onClick={() => {
                      room.disableNetworkMetricsReport();
                      setNetworkMetrics(undefined);
                    }}
                  />
                </div>
              )}

              <Feeds
                key='feeds'
                dataTestId='feeds'
                participants={state.participants}
                participantsByActivity={room.participantsByActivity}
                dominantSpeakerId={room.dominantSpeakerId}
                presenter={room.presenter}
                streams={room.state.streams}
                getParticipantStream={room.getParticipantStream}
                getStatsForParticipantStream={room.getWebRTCStatsForStream}
                camera={camera}
              />
            </React.Fragment>
          )}
        </Box>

        {state.status === 'connected' && isParticipantsListVisible && (
          <Box width='medium' fill='vertical'>
            <ParticipantsList
              participants={state.participants}
              getParticipantStream={room.getParticipantStream}
              setIsParticipantsListVisible={setIsParticipantsListVisible}
            />
          </Box>
        )}

        {state.status === 'connected' && isInviteParticipantVisible && (
          <Box width='medium' fill='vertical'>
            <InviteParticipant
              roomId={roomId}
              setIsInviteParticipantVisible={setIsInviteParticipantVisible}
              invitedParticipants={invitedParticipants}
              setInvitedParticipants={setInvitedParticipants}
            />
          </Box>
        )}
      </Box>
      {state.status === 'connected' && (
        <>
          <RoomControls
            isParticipantsListVisible={isParticipantsListVisible}
            isInviteParticipantVisible={isInviteParticipantVisible}
            setIsParticipantsListVisible={setIsParticipantsListVisible}
            setIsInviteParticipantVisible={setIsInviteParticipantVisible}
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
            sendMessage={room.sendMessage}
            messages={room.messages}
            getLocalParticipant={room.getLocalParticipant}
            camera={camera}
          />
          <RoomAudio
            useMixedAudioForOutput={optionalFeatures.useMixedAudioForOutput}
            participants={state.participants}
            streams={state.streams}
            mixedAudioTrack={state.mixedAudioTrack}
          />
        </>
      )}
    </Box>
  );
}

export default Room;
