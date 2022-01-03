import React, { useMemo } from 'react';

import { TelnyxRoom } from 'hooks/room';
import AudioTrack from 'components/AudioTrack';

export default function RoomAudio({
  participants,
  streams,
  useAudioMixer,
  mixedAudioTrack,
  audioOutputDeviceId,
}: {
  participants: TelnyxRoom['state']['participants'];
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

    participants.forEach((participant) => {
      if (participant.origin === 'local') {
        return;
      }

      const selfStreamId = participant.streams.get('self');
      if (selfStreamId) {
        const stream = streams.get(selfStreamId);
        if (!stream || !stream.transceiver.isConfigured) {
          return;
        }

        if (stream.audioTrack) {
          audioTracks.push({
            id: stream.id,
            track: stream.audioTrack,
          });
        }
      }
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
