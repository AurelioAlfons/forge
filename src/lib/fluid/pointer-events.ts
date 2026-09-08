type Listener = (event: PointerEvent) => void;
const listeners = new Set<Listener>();
let position = { x: -1, y: -1 };
export const getPointerPosition = () => position;
const dispatch = (event: PointerEvent) => {
  position = { x: event.clientX, y: event.clientY };
  listeners.forEach((listener) => listener(event));
};

// haze and fluid share one pointer stream; each layer decides if it is active.
export function subscribePointer(listener: Listener) {
  if (!listeners.size)
    window.addEventListener("pointermove", dispatch, { passive: true });
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("pointermove", dispatch);
  };
}
