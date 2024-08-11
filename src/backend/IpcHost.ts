import { IpcInvokeReturn, IpcListener, IpcSocketBackend, ipcChannel, RemoveFunction } from '../common/IpcSocket'


/**
 * Options for [[IpcHost.startup]]
 * @public
 */
export interface IpcHostOpts {
  socket?: IpcSocketBackend;
}

/**
 * Used by applications that have a dedicated backend. IpcHosts may send messages to their corresponding IpcApp.
 * @note if either end terminates, the other must too.
 * @public
 */
export class IpcHost {
  /** Determine whether Ipc is available for this backend. This will only be true if [[startup]] has been called on this class. */
  public static get isValid(): boolean { return undefined !== this._ipc }

  private static _ipc: IpcSocketBackend | undefined
  
  /** Get the implementation of the [IpcSocketBackend]($common) interface. */
  private static get ipc(): IpcSocketBackend { return this._ipc! }
  
  /**
   * Send a message to the frontend over an Ipc channel.
   * @param channel the name of the channel matching the name registered with [[IpcApp.addListener]].
   * @param data The content of the message.
   */
  public static send(channel: string, ...data: any[]): void {
    this.ipc.send(ipcChannel(channel), ...data)
  }
  
  /**
   * Establish a handler for an Ipc channel to receive [[Frontend.invoke]] calls
   * @param channel The name of the channel for this handler.
   * @param handler A function that supplies the implementation for `channel`
   * @note returns A function to call to remove the handler.
   */
  public static handle(channel: string, handler: (...args: any[]) => Promise<any>): RemoveFunction {
    return this.ipc.handle(ipcChannel(channel), handler)
  }
  
  /**
   * Establish a handler to receive messages sent via [[IpcApp.send]].
   * @param channel The name of the channel for the messages.
   * @param listener A function called when messages are sent over `channel`
   * @note returns A function to call to remove the listener.
   */
  public static addListener(channel: string, listener: IpcListener): RemoveFunction {
    return this.ipc.addListener(ipcChannel(channel), listener)
  }
  
  /**
   * Remove a previously registered listener
   * @param channel The name of the channel for the listener previously registered with [[addListener]]
   * @param listener The function passed to [[addListener]]
   */
  public static removeListener(channel: string, listener: IpcListener): void {
    this.ipc.removeListener(ipcChannel(channel), listener)
  }
  
  /**
   * Start the backend of an Ipc app.
   * @param opt
   * @note this method calls [[IModelHost.startup]] internally.
   */
  public static async startup(opt?: IpcHostOpts): Promise<void> {
    this._ipc = opt?.socket
    
    if (this.isValid) {
      IpcAppHandler.register()
    }
  }
  
  /** Shutdown IpcHost backend. Also calls [[IModelHost.shutdown]] */
  public static async shutdown(): Promise<void> {
    this._ipc = undefined
  }
}

/**
 * Base class for all implementations of an Ipc interface.
 *
 * Create a subclass to implement your Ipc interface. Your class should be declared like this:
 * ```ts
 * class MyHandler extends IpcHandler implements MyInterface
 * ```
 * to ensure all methods and signatures are correct.
 *
 * Then, call `MyClass.register` at startup to connect your class to your channel.
 * @public
 */
export abstract class IpcHandler {
  /** All subclasses must implement this method to specify their channel name. */
  public abstract get channelName(): string;
  
  /**
   * Register this class as the handler for methods on its channel. This static method creates a new instance
   * that becomes the handler and is `this` when its methods are called.
   * @returns A function that can be called to remove the handler.
   * @note this method should only be called once per channel. If it is called multiple times, subsequent calls replace the previous ones.
   */
  public static register(): RemoveFunction {
    const impl = new (this as any)() as IpcHandler // create an instance of subclass. "as any" is necessary because base class is abstract
    return IpcHost.handle(
      impl.channelName,
      async (_evt: Event, funcName: string, ...args: any[]): Promise<IpcInvokeReturn> => {
        try {
          const func = (impl as any)[funcName]
          if (typeof func !== 'function') {
            throw new Error(`Method "${ impl.constructor.name }.${ funcName }" not found on IpcHandler registered for channel: ${ impl.channelName }`)
          }
          
          return { result: await func.call(impl, ...args) }
        } catch (err: any) {
          const ret: IpcInvokeReturn = {
            error: {
              name: err.hasOwnProperty('name') ? err.name : err.constructor?.name ?? 'Unknown Error',
              message: err.message,
              errorNumber: err.errorNumber ?? 0,
            },
          }
          
          
          return ret
        }
      },
    )
  }
}

/**
 * Implementation  of IpcAppFunctions
 */
class IpcAppHandler extends IpcHandler {
  public get channelName() { return 'IpcAppChannel.Functions'; }
  
}
