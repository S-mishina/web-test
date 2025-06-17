// proxy-runtime のすべてのシンボルをエクスポート
export * from "@solo-io/proxy-runtime/proxy";

import {
  RootContext,
  Context,
  registerRootContext,
  FilterHeadersStatusValues
} from "@solo-io/proxy-runtime";

// リクエストごとのコンテキスト定義
class MyContext extends Context {
  // リクエストヘッダー受信時のフック
  onRequestHeaders(): FilterHeadersStatusValues {
    const path = this.getRequestHeader(":path");

    // 条件付きでヘッダーを付与
    if (path == "/target-path") {
      this.addRequestHeader("x-my-header", "true");
    }

    // 常に次のフィルタに進む
    return FilterHeadersStatusValues.Continue;
  }
}

// Envoyインスタンスごとの RootContext 定義
class MyRootContext extends RootContext {
  // AssemblyScript では必ず引数なしで Context を返す必要あり
  createContext(): Context {
    return new MyContext(); // 引数なし！
  }
}

// root_id を "my_root_context" に設定（Istio 側と一致させること）
registerRootContext(() => new MyRootContext(), "my_root_context");
