import Link from 'next/link';
import { Anchor, Header, Nav } from 'grommet';

export default function AppHeader({ ...unhandledProps }) {
  return (
    <Header pad='small' {...unhandledProps}>
      <Anchor href='/' weight='bold' size='large' label='video meet' />
    </Header>
  );
}
