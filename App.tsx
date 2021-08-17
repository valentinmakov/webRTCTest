import React from 'react';
import {Alert, Text, View} from 'react-native';
import {
    EventOnCandidate,
    RTCSessionDescriptionType,
    RTCPeerConnection,
    RTCPeerConnectionConfiguration,
} from 'react-native-webrtc';

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

const initConnectionCreation = async (peerConnection: RTCPeerConnection): Promise<void> => {
    const sdp: RTCSessionDescriptionType = await peerConnection.createOffer();
    peerConnection.setLocalDescription(sdp);
};

const finalizeConnectionCreation = async (
    peerConnection: RTCPeerConnection,
    peerDeviceUrl: string,
    setIsPCEstablished: React.Dispatch<React.SetStateAction<boolean>>,
): Promise<void> => {
    const fullSDP: RTCSessionDescriptionType = await peerConnection.createOffer();
	await peerConnection.setLocalDescription(fullSDP);
    try {
        const sdpAnswerResponse = await fetch(peerDeviceUrl, {
            method: 'POST',
            body: JSON.stringify(fullSDP),
        });
        const sdpAnswer: RTCSessionDescriptionType = await sdpAnswerResponse.json();
        await peerConnection.setRemoteDescription(sdpAnswer);
        setIsPCEstablished(true);
    } catch (error) {
        Alert.alert('Could not get SDP answer: Fetch error', JSON.stringify(error));
    }
};

const App: React.FC = (): React.ReactElement => {
    const [pc, setPc] = React.useState<RTCPeerConnection | null>(null);
    const [isPCEstablished, setIsPCEstablished] = React.useState<boolean>(false);
    const [channel, setChannel] = React.useState<RTCDataChannel | null>(null);

    React.useEffect(
        () => {
            if (isPCEstablished && pc) {
                const channel: RTCDataChannel = pc.createDataChannel('channel') as unknown as RTCDataChannel;
                channel.onopen = () => {
                    Alert.alert('channel is open');
                };
                channel.onclose = () => {
                    Alert.alert('Channel closed');
                };
                setChannel(channel);
            }
        },
        [isPCEstablished],
    );

    React.useEffect(
        () => {
            if (channel?.readyState === 'closed') {
                setChannel(null);
            }
        },
        [channel?.readyState]
    );

    React.useEffect(
        () => {
            if (pc?.connectionState === 'closed') {
                setPc(null);
            }
        },
        [pc?.connectionState]
    );

    const createNewConnection = async (): Promise<void> => {
        const pc: RTCPeerConnection = new RTCPeerConnection(webRTCConfig);
        setPc(pc);
        pc.onicecandidate = (event: EventOnCandidate): void => {
			if (!event.candidate) {
				finalizeConnectionCreation(pc, PEER_DEVICE_URL, setIsPCEstablished);
			}
		};
		pc.onconnectionstatechange = () => {
			Alert.alert('RTC connection status', pc.connectionState);
		};
        initConnectionCreation(pc);
    };
    
    const closeChannel = (): void => {
        if (!channel) {
            Alert.alert('No channel is open');
            return;
        }
        channel.close();
    };

    const closeConnection = (): void => {
        if (!pc) {
            Alert.alert('No connection is open');
            return;
        }
        pc.close();
    };

    return (
        <View style={{justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', flex: 1}}>
            <Text>WebRTC</Text>
        </View>
    );
};

export default App;
