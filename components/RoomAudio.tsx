import React, { useMemo } from 'react';
import { TelnyxRoom } from '../hooks/room';
import AudioTrack from './AudioTrack';

export default function RoomAudio({
  participants,
  localParticipantId,
  streams,
  useAudioMixer,
  mixedAudioTrack,
  audioOutputDeviceId,
}: {
  participants: TelnyxRoom['participants'];
  localParticipantId: TelnyxRoom['localParticipantId'];
  streams: TelnyxRoom['streams'];
  useAudioMixer: boolean;
  mixedAudioTrack?: MediaStreamTrack;
  audioOutputDeviceId?: MediaDeviceInfo['deviceId'];
}) {
  const audioTracks = useMemo(() => {
    if (useAudioMixer) {
      return [];
    }

    const audioTracks: Array<{ id: string; track: MediaStreamTrack }> = [];

    participants.forEach((participant) => {
      if (participant.id === localParticipantId) {
        return;
      }

      participant.streams.forEach((stream) => {
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
