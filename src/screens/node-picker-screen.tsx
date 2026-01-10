import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { WalletConfig } from 'config/wallet-config';

import { InputField, ScreenLayout, TextButton, TextField, TouchableOpacity } from '@/components';
import { useGlobalStore, usePreferencesStore, useThemeStore } from '@/services';
import { randomNode } from '@/utils';

import offline_node_list from '../config/nodes.json';
import { Wallet } from '../services/kryptokrona';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Switch } from 'react-native';
import { Nodes } from '../lib/native';


interface Props {
  route: any;
}

export const PickNodeScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const preferences = usePreferencesStore((state) => state.preferences);
  const [nodeInput, setNodeInput] = useState(preferences.node || ''); // Initialize with preferences.node
  const [nodeList, setNodeList] = useState([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(
    preferences.node,
  );
  const [loadingNode, setLoadingNode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCheck, setCheckLoading] = useState(false);
  const huginNode = useGlobalStore((state) => state.huginNode);

  const Tab = createMaterialTopTabNavigator();
  const [huginMode, setHuginMode] = useState<'automatic' | 'manual'>(
  preferences.huginNodeMode ?? 'automatic'
);

  const [huginNodeInput, setHuginNodeInput] = useState(preferences.huginNode || '');


  const theme = useThemeStore((state) => state.theme);

  // const color = theme.foreground;

  const borderColor = theme.input;

  async function fetchWithTimeout(url, options, timeout = 1000) {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeout),
      ),
    ]);
  }

  const navigation = useNavigation();

  useEffect(() => {
    const fetchNodes = async () => {
      let response;
      for (const url of WalletConfig.nodeListURLs) {
        try {
          response = await fetchWithTimeout(url, {});
          break;
        } catch (err) {}
      }

      let data;

      if (!response) {
        data = offline_node_list;
      } else {
        data = await response.json();
      }

      setNodeList(data.nodes);
    };

    fetchNodes();
  }, []);

  const checkNodes = async () => {
    setCheckLoading(true);
    const updatedNodeList = await Promise.all(
      nodeList.map(async (node) => {
        const nodeURL = `${node.ssl ? 'https://' : 'http://'}${node.url}:${
          node.port
        }/info`;

        try {
          const resp = await fetchWithTimeout(nodeURL, { method: 'GET' });
          const json = await resp.json();
          const height = json?.height;
          return { ...node, online: true, height }; // Mark node as online
        } catch (error) {
          return { ...node, online: false }; // Mark node as offline
        }
      }),
    );

    setNodeList(updatedNodeList); // Update the state with the new node list
    setCheckLoading(false);
  };

  useEffect(() => {
  usePreferencesStore.setState((state) => ({
    preferences: {
      ...state.preferences,
      huginNodeMode: huginMode,
    },
  }));
}, [huginMode]);

//   useEffect(() => {
//   usePreferencesStore.setState((state) => ({
//     preferences: {
//       ...state.preferences,
//       huginNode: huginNodeInput,
//     },
//   }));
// }, [huginNode]);

  const handleRandomNode = async () => {
    setLoadingNode(true);
    const node = await randomNode(true);
    chooseNode(node);
    setLoadingNode(false);
  }

  const connectToNode = () => {
    setLoading(true);
    const isSSL = nodeInput.startsWith('https://');
    const inputWithoutProtocol = nodeInput.replace(/(^\w+:|^)\/\//, '');
    const [url, port] = inputWithoutProtocol.split(':');

    const selectedNodeDetails = {
      port: parseInt(port) || '',
      ssl: isSSL,
      url,
    };

    setSelectedNode(selectedNodeDetails);
    Wallet.node(nodeInput);
    usePreferencesStore.setState((state) => ({
      preferences: { ...state.preferences, node: nodeInput },
    }));
    setLoading(false);
    // Simulate dispatch or navigation action
    navigation.goBack(); // Adjust as needed for your navigation structure
  };

  const connectToHuginNode = () => {
    setLoading(true);
    // setSelectedNode(selectedNodeDetails);
    // Wallet.node(nodeInput);
    usePreferencesStore.setState((state) => ({
      preferences: { ...state.preferences, huginNode: huginNodeInput },
    }));
    setLoading(false);
    Nodes.connect(huginNodeInput, false)
    // Simulate dispatch or navigation action
    // navigation.goBack(); // Adjust as needed for your navigation structure
};

  const chooseNode = (node) => {
    setNodeInput(`${node.url}:${node.port}`);
    setSelectedNode(node);
  };

  const renderNode = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.nodeCard,
        selectedNode === index && styles.selectedNodeCard,
        { borderColor: borderColor },
      ]}
      onPress={() => chooseNode(item)}>
      <TextField>{item.name}</TextField>
      {item?.height &&
      <View style={[styles.height, {backgroundColor: theme.foreground}]}>
        <TextField size='mediumsmall' color={theme.background}>{item.height}</TextField>
      </View>
      }
      <View
        style={[
          styles.statusIndicator,
          item.online ? styles.online : styles.offline,
        ]}
      />
    </TouchableOpacity>
  );

  const XKRNodeTab = () => {
    return <View style={[{ flex: 1, backgroundColor: theme.background, }]}>
        <View>
          <InputField
            label={t('inputNodeUrl')}
            value={nodeInput}
            onChange={setNodeInput}
          />
          <TextButton
            icon={loadingNode ? <ActivityIndicator color="#000" /> : undefined}
            onPress={handleRandomNode}>
            {t('randomNode')}
          </TextButton>
          <TextButton
            icon={loading ? <ActivityIndicator color="#000" /> : undefined}
            onPress={connectToNode}>
            {t('connectToNode')}
          </TextButton>
          <TextButton
            icon={loadingCheck ? <ActivityIndicator color="#000" /> : undefined}
            onPress={checkNodes}>
            {t('checkNodes')}
          </TextButton>
        </View>
        <FlatList
          initialNumToRender={999}
          maxToRenderPerBatch={999}
          data={nodeList}
          keyExtractor={(item) => item.url + ':' + item.port}
          renderItem={renderNode}
          contentContainerStyle={styles.nodeList}
        />
      </View>
  }

  const HuginNodeTab = () => {
  const isManual = huginMode === 'manual';

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: 15 }}>

    {huginNode?.connected === true && 
    <>
      <TextField size="small">Connected to:</TextField>
        <TextField size="xsmall">
          {huginNode?.address}
        </TextField>
      </>
    }

    {huginNode?.connected != true && 
      <TextField size="small">Not connected</TextField>
    }
    
      
      {/* Mode switch */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: 16,
        }}
      >
        <TextField>
          {isManual ? t('manual') : t('automatic')}
        </TextField>

        <Switch
          value={isManual}
          onValueChange={(value) =>
            setHuginMode(value ? 'manual' : 'automatic')
          }
          trackColor={{
            false: theme.input,
            true: theme.foreground,
          }}
          thumbColor={theme.background}
        />
      </View>

      {/* Manual-only UI */}
      {isManual && (
        <View>
          <InputField
            label={t('inputNodeAddress')}
            value={huginNodeInput}
            onChange={setHuginNodeInput}
          />
          <TextButton
            icon={loading ? <ActivityIndicator /> : undefined}
            onPress={connectToHuginNode}
          >
            {t('connectToNode')}
          </TextButton>
        </View>
      )}

    </View>
  );
};


  return (
    <ScreenLayout>

      <Tab.Navigator
        screenOptions={{
          swipeEnabled: true,
          tabBarIndicatorStyle: {
            backgroundColor: theme.foreground,
          },
          tabBarStyle: {
            backgroundColor: theme.background,
          },
          tabBarLabelStyle: {
            color: theme.foreground,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="XKR Node"
          component={XKRNodeTab}
          options={{ title: 'XKR node' }}
        />
        <Tab.Screen
          name="Hugin Node"
          component={HuginNodeTab}
          options={{ title: 'Hugin node' }}
        />
      </Tab.Navigator>
      
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  nodeCard: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    padding: 12,
    position: 'relative'
  },
  nodeList: {
    marginTop: 16,
    paddingBottom: 16,
  },
  offline: {
    backgroundColor: 'red',
  },
  online: {
    backgroundColor: 'green',
  },
  selectedNodeCard: {
    borderColor: '#4caf50',
  },
  statusIndicator: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  height: {
    fontSize: 8,
    borderRadius: 5,
    position: 'absolute',
    right: 36,
    top: 15,
    paddingLeft: 4,
    paddingRight: 4
  }
});
