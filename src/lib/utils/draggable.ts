import { writable } from 'svelte/store';
import type { Card } from './deckUtility';

// Store for the currently dragged card
export const draggedCard = writable<{
  card: Card;
  sourceElement: HTMLElement | null;
  sourceZone: string;
} | null>(null);

// Store for valid drop targets
export const dropTargets = writable<{
  element: HTMLElement;
  zone: string;
  playerIndex?: number;
}[]>([]);

// Interface for draggable options
export interface DraggableOptions {
  zone: string;
  playerIndex?: number;
  enabled?: boolean;
  data?: any;
}

// Action to make an element draggable
export function draggable(node: HTMLElement, options: DraggableOptions) {
  let dragging = false;
  let startX: number, startY: number;
  let initialTransform: string;
  
  // Initialize transform property
  if (!node.style.transform) {
    node.style.transform = 'translate(0px, 0px)';
  }
  
  function handleMouseDown(event: MouseEvent) {
    if (!options.enabled) return;
    
    event.preventDefault(); // Prevent text selection
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    initialTransform = node.style.transform;
    
    // Apply "being dragged" styles
    node.style.zIndex = '1000';
    node.style.opacity = '0.8';
    node.style.transition = 'none';
    
    // Store the dragged card information
    if (options.data) {
      draggedCard.set({
        card: options.data,
        sourceElement: node,
        sourceZone: options.zone
      });
    }
    
    // Add event listeners for mouse movement and release
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
  
  function handleMouseMove(event: MouseEvent) {
    if (!dragging) return;
    
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    
    node.style.transform = `translate(${dx}px, ${dy}px)`;
  }
  
  function handleMouseUp() {
    if (!dragging) return;
    
    dragging = false;
    
    // Remove dragging styles
    node.style.zIndex = '';
    node.style.opacity = '';
    node.style.transition = 'transform 0.2s ease';
    node.style.transform = initialTransform;
    
    // Clean up and reset stores
    draggedCard.set(null);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
  
  // Add the mousedown listener
  node.addEventListener('mousedown', handleMouseDown);
  
  // Return the update and destroy functions
  return {
    update(newOptions: DraggableOptions) {
      options = newOptions;
    },
    destroy() {
      node.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  };
}

// Action to make an element a drop target
export function dropTarget(node: HTMLElement, options: DraggableOptions) {
  let hoverActive = false;
  
  function registerAsDropTarget() {
    dropTargets.update(targets => [
      ...targets, 
      { element: node, zone: options.zone, playerIndex: options.playerIndex }
    ]);
  }
  
  function unregisterAsDropTarget() {
    dropTargets.update(targets => 
      targets.filter(target => target.element !== node)
    );
  }
  
  function handleDragEnter() {
    if (!options.enabled) return;
    hoverActive = true;
    node.classList.add('drop-target-hover');
  }
  
  function handleDragLeave() {
    if (!options.enabled) return;
    hoverActive = false;
    node.classList.remove('drop-target-hover');
  }
  
  // Process the drop if it's valid
  function handleDrop(event: Event) {
    if (!options.enabled || !hoverActive) return;
    
    // Dispatch a custom event for the parent component to handle
    const dropEvent = new CustomEvent('cardDrop', {
      detail: {
        targetZone: options.zone,
        playerIndex: options.playerIndex
      }
    });
    
    node.dispatchEvent(dropEvent);
    
    // Reset styles
    node.classList.remove('drop-target-hover');
    hoverActive = false;
  }
  
  // Track mouse movement to simulate drag enter/leave
  const unsubscribe = draggedCard.subscribe(dragInfo => {
    if (!dragInfo || !options.enabled) {
      handleDragLeave();
      return;
    }
    
    // Check if mouse is over this element
    const handleMouseMove = (event: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      const isInside = 
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      
      if (isInside && !hoverActive) {
        handleDragEnter();
      } else if (!isInside && hoverActive) {
        handleDragLeave();
      }
    };
    
    // Check if mouse is released over this element
    const handleMouseUp = (event: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      const isInside = 
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      
      if (isInside) {
        handleDrop(event);
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });
  
  // Register as drop target when initialized
  registerAsDropTarget();
  
  // Return the update and destroy functions
  return {
    update(newOptions: DraggableOptions) {
      options = newOptions;
      
      // Update registration if needed
      unregisterAsDropTarget();
      registerAsDropTarget();
    },
    destroy() {
      unregisterAsDropTarget();
      unsubscribe();
    }
  };
}