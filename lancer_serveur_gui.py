import http.server
import socketserver
import webbrowser
import threading
import tkinter as tk

PORT = 8000

def run_server():
    with socketserver.TCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
        httpd.serve_forever()

threading.Thread(target=run_server, daemon=True).start()
webbrowser.open(f"http://localhost:{PORT}/")

# Fenêtre de contrôle
root = tk.Tk()
root.title("Serveur Budget App")
root.geometry("300x100")
tk.Label(root, text="Fermeture = arrêt du serveur").pack(pady=10)
tk.Button(root, text="Quitter", command=root.destroy).pack()
root.mainloop()
