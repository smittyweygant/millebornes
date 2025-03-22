<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { onMount } from 'svelte';
    
    export let message: string = '';
    export let type: 'success' | 'warning' | 'error' | 'info' = 'info';
    export let duration: number = 3000;
    export let showClose: boolean = true;
    
    let visible: boolean = false;
    let timer: NodeJS.Timeout;
    
    onMount(() => {
      if (message) {
        show();
      }
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    });
    
    // Show the notification
    export const show = () => {
      visible = true;
      
      if (duration > 0) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          visible = false;
        }, duration);
      }
    };
    
    // Close the notification
    export const close = () => {
      visible = false;
      if (timer) clearTimeout(timer);
    };
    
    // Update the message
    export const updateMessage = (newMessage: string, newType?: 'success' | 'warning' | 'error' | 'info') => {
      message = newMessage;
      if (newType) type = newType;
      show();
    };
    
    $: typeClass = `type-${type}`;
  </script>
  
  {#if visible}
    <div 
      class="notification {typeClass}"
      transition:fly={{ y: -20, duration: 300 }}
      role="alert"
    >
      <div class="notification-content">
        <div class="notification-message">{message}</div>
        
        {#if showClose}
          <button class="notification-close" on:click={close}>×</button>
        {/if}
      </div>
    </div>
  {/if}
  
  <style>
    .notification {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: auto;
      max-width: 80%;
      min-width: 300px;
      padding: 1rem;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
    }
  
    .notification-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  
    .notification-message {
      flex: 1;
    }
  
    .notification-close {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      opacity: 0.7;
      margin-left: 1rem;
      padding: 0;
    }
  
    .notification-close:hover {
      opacity: 1;
    }
  
    .type-success {
      background-color: #f6ffed;
      border: 1px solid #b7eb8f;
      color: #52c41a;
    }
  
    .type-warning {
      background-color: #fffbe6;
      border: 1px solid #ffe58f;
      color: #faad14;
    }
  
    .type-error {
      background-color: #fff2f0;
      border: 1px solid #ffccc7;
      color: #ff4d4f;
    }
  
    .type-info {
      background-color: #e6f7ff;
      border: 1px solid #91d5ff;
      color: #1890ff;
    }
  </style>