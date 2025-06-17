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

class RewriteRoot extends RootContext {
  createContext(): Context {
    return ContextHelper.wrap(new RewriteContext(this));
  }
}

class RewriteContext extends Context {
  root_context: RewriteRoot;

  constructor(root_context: RewriteRoot) {
    super();
    this.root_context = root_context;
  }

  onRequestHeaders(_: u32): FilterHeadersStatusValues {
    let path = stream_context.headers.request.get(":path");
    if (path !== null && path.startsWith("/test/") && path.endsWith(".json")) {
      let name = path.substring(6, path.length - 5);
      let newPath = "/test1/" + name;
      stream_context.headers.request.replace(":path", newPath);
    }
    return FilterHeadersStatusValues.Continue;
  }
}

registerRootContext(() => {
  return RootContextHelper.wrap(new RewriteRoot());
}, "rewrite_path");
