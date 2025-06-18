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
  req_path: string = "";   // 書き換え前のパス
  req_path1: string = "";  // 書き換え後のパスまたは失敗時のマーク

  constructor(root_context: AddHeaderRoot) {
    super();
    this.root_context = root_context;
  }

  onRequestHeaders(_numHeaders: u32): FilterHeadersStatusValues {
    const path = stream_context.headers.request.get(":path");

    if (path !== null) {
      this.req_path = path;

      // 条件一致で path を書き換える
      if (path === "/health/liveness") {
        stream_context.headers.request.replace(":path", "/health/rediness");
      }

      // 書き換え後のパスを取得して検証用に保存
      const new_path = stream_context.headers.request.get(":path");
      this.req_path1 = new_path !== null ? new_path : "replace_failed";
    } else {
      this.req_path = "null_path";
      this.req_path1 = "null_path";
    }

    return FilterHeadersStatusValues.Continue;
  }

  onResponseHeaders(_numHeaders: u32): FilterHeadersStatusValues {
    const root_context = this.root_context;

    // デバッグ用のパスヘッダー出力
    stream_context.headers.response.add("path_test", this.req_path);
    stream_context.headers.response.add("path_test2", this.req_path1);

    // コンフィグに応じたヘッダー追加
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
