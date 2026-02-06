# Global Modal System Usage

The global modal system allows any component in the app to trigger modals without worrying about containment issues.

## How to use

### Import the store
```typescript
import { modalStore } from '$lib/stores/modal';
```

### Open a modal
```typescript
// Simple modals (privacy, terms)
modalStore.open('privacy');
modalStore.open('terms');

// Future modals with data
modalStore.open('profile', { userId: 123 });
modalStore.open('settings', { tab: 'notifications' });
modalStore.open('friends');
```

### Close a modal
```typescript
modalStore.close();
```

## Adding new modal types

1. Add the modal type to `src/lib/stores/modal.ts`:
```typescript
export type ModalType = 'privacy' | 'terms' | 'settings' | 'profile' | 'friends' | 'your-new-modal' | null;
```

2. Add the modal content to `src/routes/+layout.svelte`:
```typescript
const modalContent = {
  // ...existing modals
  'your-new-modal': {
    title: 'Your Modal Title',
    content: 'Your modal content'
  }
};
```

For complex modals with custom content, you can modify the modal rendering logic in `+layout.svelte` to render different components based on the modal type.

## Example: Opening modal from a button
```svelte
<script>
  import { modalStore } from '$lib/stores/modal';
</script>

<button onclick={() => modalStore.open('settings')}>
  Open Settings
</button>
```
