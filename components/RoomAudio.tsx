import React, { useMemo } from 'react';
import { TelnyxRoom } from '../hooks/room';
import AudioTrack from './AudioTrack';

export default function RoomAudio({
  participants,
  publisher,
  streams,
  useAudioMixer,
  mixedAudioTrack,
  audioOutputDeviceId,
}: {
  participants: TelnyxRoom['state']['participants'];
  publisher: TelnyxRoom['state']['publisher'];
  streams: TelnyxRoom['state']['streams'];
  useAudioMixer: boolean;
  mixedAudioTrack?: MediaStreamTrack;
  audioOutputDeviceId?: MediaDeviceInfo['deviceId'];
}) {
  const audioTracks = useMemo(() => {
    if (useAudioMixer) {
      return [];
    }

    const audioTracks: Array<{ id: string; track: MediaStreamTrack }> = [];

    Object.keys(participants).forEach((participantId) => {
      const participant = participants[participantId];
      if (participant.id === publisher.participantId) {
        return;
      }

      Object.keys(participant.streams).forEach((key) => {
        const streamId = participant.streams[key].streamId;

        const stream = streams[streamId];
        if (!stream.audioTrack) {
          return;
        }

        audioTracks.push({
          id: stream.id,
          track: stream.audioTrack,
        });
      });
    });

    return audioTracks;
  }, [streams]);

  const roomAudio = useMemo(() => {
    if (useAudioMixer) {
      if (mixedAudioTrack) {
        return (
          <AudioTrack
            id='mixedAudio'
            audioTrack={mixedAudioTrack}
            audioOutputDeviceId={audioOutputDeviceId}
          />
        );
      }

      return null;
    }

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
  }, [audioTracks, useAudioMixer, mixedAudioTrack, audioOutputDeviceId]);

  return <>{roomAudio}</>;
}
