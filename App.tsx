import React from 'react';
import {Alert, Text, TouchableOpacity, View} from 'react-native';
import {
  EventOnCandidate,
  RTCSessionDescriptionType,
  RTCPeerConnection,
  RTCPeerConnectionConfiguration,
} from 'react-native-webrtc';

/**
 * Insert a known peer device URL here
 */
const PEER_DEVICE_URL: string = '';

interface RTCDataChannel {
  binaryType: string;
  readyState: string;
  close: () => void;
  onclose: () => void;
  onopen: () => void;
}

const webRTCConfig: RTCPeerConnectionConfiguration = {
  iceServers: [],
};

const initConnectionCreation = async (
  peerConnection: RTCPeerConnection,
  setChannel: React.Dispatch<React.SetStateAction<RTCDataChannel | null>>,
): Promise<void> => {
  const channel: RTCDataChannel = peerConnection.createDataChannel(
    'channel',
  ) as unknown as RTCDataChannel;
  channel.onopen = () => {
    Alert.alert('channel is open');
    setChannel(channel);
  };
  channel.onclose = () => {
    Alert.alert('Channel closed');
    setChannel(null);
  };
  const sdp: RTCSessionDescriptionType = await peerConnection.createOffer();
  peerConnection.setLocalDescription(sdp);
};

const finalizeConnectionCreation = async (
  peerConnection: RTCPeerConnection,
  peerDeviceUrl: string,
): Promise<void> => {
  const fullSDP: RTCSessionDescriptionType = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(fullSDP);
  try {
    const sdpAnswerResponse = await fetch(peerDeviceUrl, {
      method: 'POST',
      body: JSON.stringify(fullSDP),
    });
    const sdpAnswer: RTCSessionDescriptionType = await sdpAnswerResponse.json();
    peerConnection.setRemoteDescription(sdpAnswer);
  } catch (error) {
    Alert.alert('Could not get SDP answer: Fetch error', JSON.stringify(error));
  }
};

const App: React.FC = (): React.ReactElement => {
  const [pc, setPc] = React.useState<RTCPeerConnection | null>(null);
  const [channel, setChannel] = React.useState<RTCDataChannel | null>(null);

  React.useEffect(() => {
    const newPC: RTCPeerConnection = new RTCPeerConnection(webRTCConfig);
    setPc(newPC);
  }, []);

  React.useEffect(() => {
    if (pc?.connectionState === 'closed') {
      setPc(null);
    }
  }, [pc?.connectionState]);

  const createNewConnection = (): void => {
    if (!pc) {
      Alert.alert('No connection is possible');
      return;
    }

    pc.onicecandidate = (event: EventOnCandidate): void => {
      if (!event.candidate) {
        finalizeConnectionCreation(pc, PEER_DEVICE_URL);
      }
    };

    pc.onconnectionstatechange = () => {
      Alert.alert('RTC connection status', pc.connectionState);
    };

    initConnectionCreation(pc, setChannel);
  };

  const closeChannel = (): void => {
    if (!channel) {
      Alert.alert('No channel is open');
      return;
    }
    channel.close();
    Alert.alert('Channel status', channel.readyState);
  };

  const closeConnection = (): void => {
    if (!pc) {
      Alert.alert('No connection is open');
      return;
    }
    pc.close();
  };

  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        flex: 1,
      }}>
      <TouchableOpacity
        style={{
          width: 200,
          height: 40,
          marginBottom: 10,
          backgroundColor: pc && channel ? 'grey' : 'green',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={createNewConnection}
        disabled={pc && channel ? true : false}>
        <Text>Create WebRTC conection and channel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          width: 200,
          height: 40,
          marginBottom: 10,
          backgroundColor: channel ? 'green' : 'grey',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={closeChannel}
        disabled={channel ? false : true}>
        <Text>Close channel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          width: 200,
          height: 40,
          marginBottom: 10,
          backgroundColor: pc ? 'green' : 'grey',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={closeConnection}
        disabled={pc ? false : true}>
        <Text>Close conection</Text>
      </TouchableOpacity>
    </View>
  );
};

export default App;
