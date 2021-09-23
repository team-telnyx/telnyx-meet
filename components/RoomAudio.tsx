import React, { useMemo } from 'react';
import { TelnyxRoom } from '../hooks/room';
import AudioTrack from './AudioTrack';

export default function RoomAudio({
  participants,
  publisher,
  streams,
  audioOutputDeviceId,
}: {
  participants: TelnyxRoom['state']['participants'];
  publisher: TelnyxRoom['state']['publisher'];
  streams: TelnyxRoom['state']['streams'];
  audioOutputDeviceId?: MediaDeviceInfo['deviceId'];
}) {
  const audioTracks = useMemo(() => {
    const audioTracks: Array<{ id: string; track: MediaStreamTrack }> = [];

    Object.keys(participants).forEach((participantId) => {
      const participant = participants[participantId];
      if (participant.id === publisher.participantId) {
        return;
      }

      const streamId = participant.streams['self']?.streamId;
      if (!streamId) {
        return;
      }

      const stream = streams[streamId];
      if (!stream.audioTrack) {
        return;
      }

      audioTracks.push({
        id: stream.id,
        track: stream.audioTrack,
      });
    });

    return audioTracks;
  }, [streams]);

  const audioEls = useMemo(() => {
    return audioTracks.map(({ id, track }) => {
      return (
        <AudioTrack
          key={id}
          id={id}
          audioTrack={track}
          audioOutputDeviceId={audioOutputDeviceId}
        />
      );
    });
  }, [audioTracks, audioOutputDeviceId]);

  return <>{audioEls}</>;
}
