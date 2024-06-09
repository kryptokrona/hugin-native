export const getUserGroups = (user: string) => {
  return [
    {
      name: 'Group 1',
      topic:
        'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY',
    },
    {
      name: 'Group 2',
      topic:
        'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY',
    },
    {
      name: 'Group 3',
      topic:
        'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY',
    },
    {
      name: 'Group 4',
      topic:
        'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY',
    },
    {
      name: 'Group 5',
      topic:
        'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY',
    },
  ];
};

export const onSendGroupMessage = (message: string, topic: string) => {
  console.log({ message, topic });
};

export const onDeleteGroup = (topic: string) => {};

export const onLeaveGroup = (topic: string) => {};
