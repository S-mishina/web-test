export * from "@solo-io/proxy-runtime/proxy";
import {
  RootContext,
  Context,
  RootContextHelper,
  ContextHelper,
  registerRootContext,
  FilterHeadersStatusValues,
  stream_context,
} from "@solo-io/proxy-runtime";

class AddHeaderRoot extends RootContext {
  createContext(): Context {
    return ContextHelper.wrap(new RewritePath(this));
  }
}

class RewritePath extends Context {
  root_context: AddHeaderRoot;

  constructor(root_context: AddHeaderRoot) {
    super();
    this.root_context = root_context;
  }

  onRequestHeaders(_: u32): FilterHeadersStatusValues {
    let path = stream_context.headers.request.get(":path");
    if (path !== null) {
      if (path.startsWith("/test/") && path.endsWith(".json")) {
        // /test/ を除去し、.json を除去
        let name = path.substring(6, path.length - 5); // "/test/".length == 6, ".json".length == 5
        let newPath = "/test1/" + name;
        stream_context.headers.request.replace(":path", newPath);
      }
    }
    return FilterHeadersStatusValues.Continue;
  }
}

registerRootContext(() => {
  return RootContextHelper.wrap(new AddHeaderRoot());
}, "rewrite_path");
