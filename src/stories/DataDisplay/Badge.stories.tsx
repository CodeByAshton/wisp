import type { Meta, StoryObj } from 'wisp'
import { Badge } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'Badge',
  component: Badge,
  parameters: {
    docs: `# Badge

Small status indicators and labels for categorizing content.

## Usage

\`\`\`tsx
import { Badge } from './Badge'

<Badge label="New" variant="info" />
<Badge label="Active" variant="success" dot />
\`\`\`
`,
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Badge text',
    },
    variant: {
      control: 'select',
      options: ['default', 'info', 'success', 'warning', 'danger', 'purple'],
      description: 'Color variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Size',
    },
    dot: {
      control: 'boolean',
      description: 'Show status dot',
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = { args: { label: 'Default',     variant: 'default' } }
export const Info:    Story = { args: { label: 'New feature', variant: 'info' } }
export const Success: Story = { args: { label: 'Active',      variant: 'success', dot: true } }
export const Warning: Story = { args: { label: 'Pending',     variant: 'warning', dot: true } }
export const Danger:  Story = { args: { label: 'Error',       variant: 'danger' } }
export const Purple:  Story = { args: { label: 'Beta',        variant: 'purple' } }
export const Small:   Story = { args: { label: 'v2.0',        variant: 'info', size: 'sm' } }
