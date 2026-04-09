import type { Meta, StoryObj } from 'wisp'
import { Avatar } from './Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Avatar',
  component: Avatar,
  parameters: {
    docs: `# Avatar

User identity representations using photos or initials.

## Usage

\`\`\`tsx
<Avatar name="Ashton Lima" size="md" />
<Avatar src="/photo.jpg" name="Ashton Lima" status="online" />
\`\`\`
`,
  },
  argTypes: {
    name: { control: 'text', description: 'User name (used for initials and color)' },
    src:  { control: 'text', description: 'Image URL (optional)' },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Avatar size',
    },
    shape: {
      control: 'select',
      options: ['circle', 'rounded'],
      description: 'Shape',
    },
    status: {
      control: 'select',
      options: ['online', 'offline', 'away', 'busy'],
      description: 'Status indicator',
    },
  },
}

export default meta
type Story = StoryObj<typeof Avatar>

export const Initials:   Story = { args: { name: 'Ashton Lima', size: 'md', shape: 'circle' } }
export const WithStatus: Story = { args: { name: 'Ashton Lima', size: 'md', status: 'online' } }
export const Offline:    Story = { args: { name: 'Mia Chen',    size: 'md', status: 'offline' } }
export const Away:       Story = { args: { name: 'James Park',  size: 'md', status: 'away' } }
export const Busy:       Story = { args: { name: 'Sara Kim',    size: 'md', status: 'busy' } }
export const Large:      Story = { args: { name: 'Ashton Lima', size: 'xl', shape: 'circle' } }
export const Rounded:    Story = { args: { name: 'Ashton Lima', size: 'md', shape: 'rounded' } }

export const Group: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      {['Ashton Lima', 'Mia Chen', 'James Park', 'Sara Kim', 'Tom Lee'].map(name => (
        <Avatar key={name} name={name} size="md" />
      ))}
    </div>
  ),
}
