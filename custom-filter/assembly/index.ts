export * from "@solo-io/proxy-runtime/proxy";
import {
  RootContext,
  Context,
  RootContextHelper,
  ContextHelper,
  registerRootContext,
  FilterHeadersStatusValues,
  stream_context
} from "@solo-io/proxy-runtime";

class AddHeaderRoot extends RootContext {
  configuration: string;

  onConfigure(): bool {
    let conf_buffer = super.getConfiguration();
    let result = String.UTF8.decode(conf_buffer);
    this.configuration = result;
    return true;
  }

  createContext(): Context {
    return ContextHelper.wrap(new AddHeader(this));
  }
}

class AddHeader extends Context {
  root_context: AddHeaderRoot;
  req_path: string = "";

  constructor(root_context: AddHeaderRoot) {
    super();
    this.root_context = root_context;
  }

  onRequestHeaders(_numHeaders: u32): FilterHeadersStatusValues {
    const path = stream_context.headers.request.get(":path");
    if (path !== null) {
      this.req_path = path;
      // path に応じて書き換え
      if (path === "/health/liveness") {
        stream_context.headers.request.replace(":path", "/health/rediness");
      }
    }
    return FilterHeadersStatusValues.Continue;
  }

  onResponseHeaders(_numHeaders: u32): FilterHeadersStatusValues {
    const root_context = this.root_context;

    stream_context.headers.response.add("path_test", this.req_path);

    if (root_context.configuration == "") {
      stream_context.headers.response.add("hello", "world!");
      stream_context.headers.response.add("test", "hit");
    } else {
      stream_context.headers.response.add("hello", root_context.configuration);
      stream_context.headers.response.add("test", "miss");
    }

    return FilterHeadersStatusValues.Continue;
  }
}

registerRootContext(
  () => RootContextHelper.wrap(new AddHeaderRoot()),
  "add_header"
);
