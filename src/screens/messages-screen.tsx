import { FlatList } from 'react-native';

import { type RouteProp } from '@react-navigation/native';

import { MessagePreviewItem, ScreenLayout } from '@/components';
import type { MessagesScreens, MessagesStackParamList } from '@/types';

interface Props {
  route: RouteProp<
    MessagesStackParamList,
    typeof MessagesScreens.MessagesScreen
  >;
}

const mockChats = [
  {
    id: '1',
    lastMessage: {
      id: '123abc',
      text: 'Hello',
    },
    user: {
      id: '1',
      key: 'SEKReTXy5NuZNf9259RRXDR3PsM5r1iKe2sgkDV5QU743f4FspoVAnY4TfRPLBMpCA1HQgZVnmZafQTraoYsS9K41iePDjPZbme',
      name: 'Niljs',
    },
  },
  {
    id: '2',
    lastMessage: {
      id: 'abc123',
      text: 'Hello this is a long message that should be truncated in the UI by some dots or something like that.',
    },
    user: {
      id: '2',
      key: 'SEKReTELXeQK5mCaEqTUwHRf9ZkCgf4fNAQ7GeNKse45LuxcuL77S6BKTRn34yCMgG4ZpLwgpjpCkE9Y9pj2JNJXQ3Hzo4ByzxX',
      name: 'Pofffff',
    },
  },
  {
    id: '3',
    lastMessage: {
      id: 'skdkdjsjs',
      text: 'Hello',
    },
    user: {
      id: '3',
      key: 'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY',
      name: 'Some very long name that should be truncated in the UI by some dots or something like that.',
    },
  },
  {
    id: '4',
    lastMessage: {
      id: 'sfdxfdf',
      text: 'Hello this is a long message that should be truncated in the UI by some dots or something like that.',
    },
    user: {
      id: '4',
      key: 'SEKReX5s2Z5bY5ZQ5D5QZ5Z5b5Z5Q5Z5b5Z5Q5Z5bY5ZQ5D5QZ5Z5b5Z5Q5Z5b5Z5Q5Z5bY5ZQ5D5QZ5Z5b5Z5Q5Z5b5Z5Q5Z5b',
      name: 'Pofffff',
    },
  },
];

export const MessagesScreen: React.FC<Props> = () => {
  return (
    <ScreenLayout>
      <FlatList
        data={mockChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessagePreviewItem {...item} />}
      />
    </ScreenLayout>
  );
};
