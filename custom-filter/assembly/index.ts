export * from "@solo-io/proxy-runtime/proxy";
import {
  RootContext,
  Context,
  registerRootContext,
  FilterHeadersStatusValues,
} from "@solo-io/proxy-runtime";

class MyContext extends Context {
  onRequestHeaders(): FilterHeadersStatusValues {
    const path = this.getRequestHeader(":path");

    if (path == "/target-path") {
      this.addRequestHeader("x-my-header", "true");
    }

    return FilterHeadersStatusValues.Continue;
  }
}

class MyRootContext extends RootContext {
  createContext(): Context {
    return new MyContext();
  }
}

registerRootContext(
  () => new MyRootContext(),
  "my_root_context"
);
