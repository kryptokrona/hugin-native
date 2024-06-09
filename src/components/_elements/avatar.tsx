import { Image } from 'react-native';

interface Props {
  base64: string;
  size?: number;
}

export const Avatar: React.FC<Props> = ({ base64, size }) => {
  const uri = `data:image/png;base64,${base64}`;
  return (
    <Image
      source={{ uri }}
      style={[
        {
          height: size,
          width: size,
        },
      ]}
    />
  );
};
