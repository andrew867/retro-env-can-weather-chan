import { EventEmitter } from "stream";

const bus = new EventEmitter();
// Many modules register one listener each; tests construct multiple instances.
bus.setMaxListeners(64);
export default bus;
