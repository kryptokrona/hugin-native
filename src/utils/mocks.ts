import type { Group, Message } from '@/types';

export const mockMessages: Message[] = [
  {
    address: 'Some address',
    chat: '1',
    hash: 'SEKReTXy5NuZNf9259RRXDR3PsM5r1iKe2sgkDV5QU743f4FspoVAnY4TfRPLBMpCA1HQgZVnmZafQTraoYsS9K41iePDjPZbme',
    msg: 'Hello',
    name: 'Niljr',
    reply: '123abc',
    sent: true,
    signature: 'Some signature',
    timestamp: 1609459200,
  },
  {
    address: 'Some address',
    chat: '1',
    hash: 'SEKReTELXeQK5mCaEqTUwHRf9ZkCgf4fNAQ7GeNKse45LuxcuL77S6BKTRn34yCMgG4ZpLwgpjpCkE9Y9pj2JNJXQ3Hzo4ByzxX',
    msg: 'Hello this is a long message that should be truncated in the UI by some dots or something like that.',
    name: 'Pofffff',
    reply: 'abc123',
    sent: false,
    signature: 'Some signature',
    timestamp: 1609459200,
  },
  {
    address: 'Some address',
    chat: '1',
    hash: 'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY',
    msg: 'Hello',
    name: 'Some very long name that should be truncated in the UI by some dots or something like that.',
    reply: 'skdkdjsjs',
    sent: true,
    signature: 'Some signature',
    timestamp: 1609459200,
  },
];

export const mockGroups: Group[] = [
  {
    hash: 'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY',
    name: 'Group 1',
  },
  {
    hash: 'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY',
    name: 'Group 2',
  },
  {
    hash: 'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY',
    name: 'Group 3',
  },
  {
    hash: 'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY',
    name: 'Group 4',
  },
  {
    hash: 'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY',
    name: 'Group 5',
  },
];
