import {ExecuteManager} from "../utils/execute.js";

class NotificationManager {

  // Propiedad getter para obtener el contenedor de notificaciones
  get containerNot() {
    return ExecuteManager.execute(() => {
      const container = document.getElementById("notification-container");
      if (!container) console.error('Contenedor con id "notification-container" no encontrado.');
      return container;
    }, "Exitó! Al obtener el contenedor de notificaciones.", "Error! Al obtener el contenedor de notificaciones:");
  }

  // >>> Métodos utilizados solo dentro de esta clase. <<<


  /**
   * 🔰 Método para mostrar una notificación de éxito. 🔰
   */
  static success(message) {
    new NotificationManager().showNotification(message, "success");
  }

  // >>> Métodos estáticos utilizados en otros archivos. <<<

  /**
   * 🔰 Método para mostrar una notificación de advertencia. 🔰
   */
  static warning(message) {
    new NotificationManager().showNotification(message, "warning");
  }

  /**
   * 🔰 Método para mostrar una notificación de error. 🔰
   */
  static error(message) {
    new NotificationManager().showNotification(message, "error");
  }

  /**
   * 🔰 Método para mostrar una notificación de información. 🔰
   */
  static info(message) {
    new NotificationManager().showNotification(message, "info");
  }

  // Método de instancia para mostrar una notificación
  showNotification(message, type = "success") {
    return ExecuteManager.execute(() => {
      const container = this.containerNot;
      if (!container) throw new Error("Contenedor de notificaciones no existe.");

      const notification = document.createElement("div");
      notification.className = `notification ${type}`;
      notification.textContent = message;
      container.append(notification);

      setTimeout(() => {
        notification.classList.add("fade-out");
        notification.ontransitionend = () => notification.remove();
      }, 5000);
    }, "Exito! Al mostrar la notificación.", "Error! Al mostrar la notificación:");
  }
}

export {NotificationManager, lunaire};