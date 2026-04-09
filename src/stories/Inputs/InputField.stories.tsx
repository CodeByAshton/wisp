import type { Meta, StoryObj } from 'wisp'
import { InputField } from './InputField'

const meta: Meta<typeof InputField> = {
  title: 'Input Field',
  component: InputField,
  parameters: {
    docs: `# InputField

A flexible text input with labels, hints, error states, and prefix/suffix decorators.

## Usage

\`\`\`tsx
<InputField
  label="Email"
  placeholder="you@example.com"
  hint="We'll never share your email"
/>

<InputField
  label="Username"
  error="Username is already taken"
/>
\`\`\`
`,
  },
  argTypes: {
    label:       { control: 'text',    description: 'Input label' },
    placeholder: { control: 'text',    description: 'Placeholder text' },
    hint:        { control: 'text',    description: 'Help text below input' },
    error:       { control: 'text',    description: 'Error message' },
    prefix:      { control: 'text',    description: 'Prefix text/icon' },
    suffix:      { control: 'text',    description: 'Suffix text/icon' },
    disabled:    { control: 'boolean', description: 'Disabled state' },
    clearable:   { control: 'boolean', description: 'Show clear button' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Input height',
    },
  },
}

export default meta
type Story = StoryObj<typeof InputField>

export const Default: Story = {
  args: { label: 'Full name', placeholder: 'Ashton Lima', size: 'md' },
}

export const WithHint: Story = {
  args: {
    label: 'Email address',
    placeholder: 'you@example.com',
    hint: "We'll never share your email with anyone.",
    size: 'md',
  },
}

export const WithError: Story = {
  args: {
    label: 'Username',
    defaultValue: 'ashton_lima',
    error: 'This username is already taken.',
    size: 'md',
  },
}

export const WithPrefix: Story = {
  args: { label: 'Website', prefix: 'https://', placeholder: 'example.com', size: 'md' },
}

export const WithSuffix: Story = {
  args: { label: 'Price', suffix: 'USD', placeholder: '0.00', size: 'md' },
}

export const Clearable: Story = {
  args: { label: 'Search', defaultValue: 'Button', clearable: true, size: 'md' },
}

export const Disabled: Story = {
  args: { label: 'Account ID', defaultValue: 'acc_1234567890', disabled: true, size: 'md' },
}
