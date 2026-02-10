# Global Modal System Usage

The global modal system allows any component in the app to trigger modals without worrying about containment issues.

## Architecture

The modal system supports two types of modals:

1. **Component-based modals** (recommended for complex content)
   - Privacy Policy and Terms of Service use this pattern
   - Each has its own `.svelte` component that handles rendering
   - Content is loaded from `.md` files and parsed with `marked`

2. **Simple text modals** (for basic content)
   - Defined in `modalContent.ts`
   - Just text content, no custom components

## How to Use

### Import the store
```typescript
import { modalStore } from '$lib/components/modal/modal';
```

### Open a modal
```typescript
// Component-based modals
modalStore.open('privacy');
modalStore.open('terms');

// Future modals (with optional data)
modalStore.open('profile', { userId: 123 });
modalStore.open('settings', { tab: 'notifications' });
modalStore.open('friends');
```

### Close a modal
```typescript
modalStore.close();
```

## Adding New Component-Based Modals

1. **Add the modal type** to `modal.ts`:
```typescript
export type ModalType = 'privacy' | 'terms' | 'your-new-modal' | null;
```

2. **Add title** to `modalConfig.ts`:
```typescript
export const modalConfig = {
  'your-new-modal': {
    title: 'Your Modal Title'
  }
};
```

3. **Create the component** `YourNewModal.svelte`:
```svelte
<script lang="ts">
  // Your modal logic
</script>

<div>
  <!-- Your modal content -->
</div>
```

4. **Register in +layout.svelte**:
```svelte
{#if $modalStore.type === 'your-new-modal'}
  <Modal title={modalConfig['your-new-modal'].title} ...>
    <YourNewModal />
  </Modal>
{/if}
```

## Adding Simple Text Modals

1. Add entry to `modalContent.ts`:
```typescript
export const modalContent = {
  'simple-modal': {
    content: 'Your simple text content here.'
  }
};
```

2. Add title to `modalConfig.ts`

The fallback in `+layout.svelte` will handle rendering automatically.

## Example: Opening modal from a button
```svelte
<script>
  import { modalStore } from '$lib/components/modal/modal';
</script>

<button onclick={() => modalStore.open('privacy')}>
  View Privacy Policy
</button>
```
