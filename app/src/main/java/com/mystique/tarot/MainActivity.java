package com.mystique.tarot;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class MainActivity extends Activity {

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window w = getWindow();
        w.setStatusBarColor(Color.parseColor("#100C22"));
        w.setNavigationBarColor(Color.parseColor("#100C22"));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#100C22"));

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);

        webView.loadUrl("file:///android_asset/index.html");
        setContentView(webView);
    }

    @Override
    public void onBackPressed() {
        // Laisse le jeu gerer le retour : revient a l'accueil,
        // et quitte seulement si on est deja sur l'accueil.
        webView.evaluateJavascript("window.appBack ? window.appBack() : 'exit'", value -> {
            if (value == null || value.contains("exit")) {
                finish();
            }
        });
    }
}
