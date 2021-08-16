import React from 'react';
import {Text, View} from 'react-native';

const App: React.FC = (): React.ReactElement => {
    return (
        <View style={{justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', flex: 1}}>
            <Text>WebRTC</Text>
        </View>
    );
};

export default App;
