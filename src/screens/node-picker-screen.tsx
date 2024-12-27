import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Container,
  InputField,
  ScreenLayout,
  TextButton,
  TextField,
} from '@/components';
import { useNavigation } from '@react-navigation/native';
import { usePreferencesStore, Wallet } from '@/services';
import { Preferences } from '@/types';
import { sleep } from '@/utils';

export const PickNodeScreen: React.FC<Props> = () => {
  const preferences = usePreferencesStore((state) => state.preferences);
  const [nodeInput, setNodeInput] = useState(preferences.node || ''); // Initialize with preferences.node
  const [nodeList, setNodeList] = useState([]);
  const [selectedNode, setSelectedNode] = useState<Preferences | null>(preferences.node);
  const [loadingNode, setLoadingNode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCheck, setCheckLoading] = useState(false);
  

  async function fetchWithTimeout(url, options, timeout = 1000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
    ]);
}

  const navigation = useNavigation();

  useEffect(() => {
    const fetchNodes = async () => {
      const response = await fetch(
        'https://raw.githubusercontent.com/kryptokrona/kryptokrona-public-nodes/main/nodes.json'
      );
      const data = await response.json();
      setNodeList(data.nodes);
    };

    fetchNodes();
  }, []);

  const checkNodes = async () => {
    setCheckLoading(true);
    const updatedNodeList = await Promise.all(
      nodeList.map(async (node) => {
        const nodeURL = `${node.ssl ? 'https://' : 'http://'}${node.url}:${node.port}/info`;
  
        try {
          await fetchWithTimeout(nodeURL, { method: 'GET' });
          return { ...node, online: true }; // Mark node as online
        } catch (error) {
          return { ...node, online: false }; // Mark node as offline
        }
      })
    );
  
    setNodeList(updatedNodeList); // Update the state with the new node list
    setCheckLoading(false);
  };
  

  const randomNode = async (ssl = true) => {
    setLoadingNode(true);
    const filteredNodes = nodeList.filter((node) => node.ssl === ssl);
    const shuffledNodes = filteredNodes.sort(() => Math.random() - 0.5);

    for (const node of shuffledNodes) {
      const nodeURL = `${node.ssl ? 'https://' : 'http://'}${node.url}:${node.port}/info`;

      try {
        const response = await fetchWithTimeout(nodeURL, { method: 'GET' });
        if (response.ok) {
          setLoadingNode(false);
          chooseNode(node);
          return;
        }
      } catch (error) {
        console.error(error);
      }
    }

    setLoadingNode(false);
    if (ssl) {
      randomNode(false); // Retry with non-SSL nodes
    }
  };

  const connectToNode = () => {
    setLoading(true);
    const isSSL = nodeInput.startsWith('https://');
    const inputWithoutProtocol = nodeInput.replace(/(^\w+:|^)\/\//, '');
    const [url, port] = inputWithoutProtocol.split(':');

    const selectedNodeDetails = {
      url,
      port: parseInt(port) || '',
      ssl: isSSL,
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

  const chooseNode = (node) => {
    setNodeInput(`${node.url}:${node.port}`);
    setSelectedNode(node);
  };

  const renderNode = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.nodeCard,
        selectedNode === index && styles.selectedNodeCard,
      ]}
      onPress={() => chooseNode(item)}>
      <Text>{item.name}</Text>
      <View
        style={[
          styles.statusIndicator,
          item.online ? styles.online : styles.offline,
        ]}
      />
    </TouchableOpacity>
  );

  return (
    <ScreenLayout>
          <View style={{flex: 1}}>
            <Text style={styles.title}>Pick a Node</Text>
            <View>
              <InputField
                label={'Enter node URL'}
                value={nodeInput}
                onChange={setNodeInput}
              />
              <TextButton
                icon={loadingNode ? <ActivityIndicator color="#000" /> : undefined}
                onPress={randomNode}>
                {'Random node'}
              </TextButton>
              <TextButton
                icon={loading ? <ActivityIndicator color="#000" /> : undefined}
                onPress={connectToNode}>
                {'Connect to node'}
              </TextButton>
              <TextButton
                icon={loadingCheck ? <ActivityIndicator color="#000" /> : undefined}
                onPress={checkNodes}>
                {'Check nodes'}
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
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  button: {
    backgroundColor: '#252525',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  nodeList: {
    marginTop: 16,
    paddingBottom: 16
  },
  nodeCard: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedNodeCard: {
    borderColor: '#4caf50',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  online: {
    backgroundColor: 'green',
  },
  offline: {
    backgroundColor: 'red',
  },
});