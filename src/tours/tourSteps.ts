import type { Step } from "react-joyride";

export type TourId =
  | "dashboard"
  | "ventas"
  | "productos"
  | "caja"
  | "reportes"
  | "configuracion";

export type TourMeta = {
  id: TourId;
  label: string;
  roles: string[];
};

/** Debe coincidir con los roles permitidos de cada ruta en AppRoutes.tsx */
export const TOUR_META: TourMeta[] = [
  { id: "dashboard", label: "Inicio", roles: ["admin", "cajero", "mesero"] },
  { id: "ventas", label: "Punto de venta", roles: ["admin", "cajero", "mesero"] },
  { id: "productos", label: "Productos e inventario", roles: ["admin"] },
  { id: "caja", label: "Caja", roles: ["admin", "cajero"] },
  { id: "reportes", label: "Reportes", roles: ["admin"] },
  { id: "configuracion", label: "Configuración", roles: ["admin"] },
];

/** Ruta del módulo donde vive cada tour. Debe coincidir con AppRoutes.tsx */
export const TOUR_PATHS: Record<TourId, string> = {
  dashboard: "/dashboard",
  ventas: "/dashboard/ventas",
  productos: "/dashboard/productos",
  caja: "/dashboard/caja",
  reportes: "/dashboard/reportes",
  configuracion: "/dashboard/configuracion",
};

const commonStepProps: Partial<Step> = {
  skipBeacon: true,
  spotlightPadding: 6,
};

export const TOUR_STEPS: Record<TourId, Step[]> = {
  dashboard: [
    {
      ...commonStepProps,
      target: "body",
      placement: "center",
      title: "Bienvenido a SmarTable",
      content:
        "Este recorrido rápido te muestra las partes principales del Dashboard. Puedes saltarlo cuando quieras y volver a verlo desde el menú de ayuda.",
    },
    {
      ...commonStepProps,
      target: ".db-stats",
      title: "Resumen del día",
      content:
        "Aquí ves de un vistazo las ventas de hoy, el efectivo y las transferencias recibidas, y si hay insumos con stock bajo.",
    },
    {
      ...commonStepProps,
      target: ".db-mid",
      title: "Ventas y categorías",
      content:
        "Estas tarjetas muestran la evolución de ventas de los últimos 7 días y cómo se distribuyen por categoría de producto.",
    },
    {
      ...commonStepProps,
      target: ".db-bottom",
      title: "Productos y alertas",
      content:
        "Consulta los productos más vendidos, las alertas de stock bajo y las últimas ventas registradas en la caja actual.",
    },
    {
      ...commonStepProps,
      target: ".db-nav",
      placement: "right",
      title: "Menú de navegación",
      content:
        "Desde aquí accedes a Ventas, Productos, Caja, Reportes y Configuración, según los permisos de tu rol.",
    },
  ],

  ventas: [
    {
      ...commonStepProps,
      target: ".ventas-sidebar-tabs",
      title: "Nuevo pedido y por cobrar",
      content:
        "En \"Nuevo Pedido\" armas un pedido nuevo. En \"Por Cobrar\" ves los pedidos pendientes de pago de todas las mesas.",
    },
    {
      ...commonStepProps,
      target: ".ventas-sidebar-content",
      placement: "left",
      title: "Paso 1: elige salón y mesa",
      content:
        "Antes de poder seleccionar productos, primero debes elegir el salón y la mesa del pedido. Sin este paso, el catálogo de productos permanecerá bloqueado.",
    },
    {
      ...commonStepProps,
      target: ".ventas-search-wrapper",
      title: "Buscar productos",
      content: "Escribe el nombre de un producto para encontrarlo rápidamente en el catálogo.",
    },
    {
      ...commonStepProps,
      target: ".ventas-filtros",
      title: "Filtrar por categoría",
      content: "Usa estos filtros para mostrar solo los productos de una categoría específica.",
    },
    {
      ...commonStepProps,
      target: ".ventas-grid",
      title: "Paso 2: agrega productos",
      content:
        "Con el salón y la mesa ya seleccionados, haz clic en un producto para agregarlo al pedido. El carrito y el total se actualizan en la barra lateral.",
    },
  ],

  productos: [
    {
      ...commonStepProps,
      target: ".pr-header",
      title: "Productos e inventario",
      content:
        "Desde este botón puedes crear un producto, categoría, insumo o proveedor nuevo, según la pestaña activa.",
    },
    {
      ...commonStepProps,
      target: ".pr-tabs",
      title: "Secciones",
      content:
        "Cambia entre Productos, Categorías, Insumos y Proveedores para gestionar cada parte de tu catálogo.",
    },
    {
      ...commonStepProps,
      target: ".pr-toolbar",
      title: "Buscar y filtrar",
      content: "Busca un producto por nombre o filtra la lista por categoría.",
    },
  ],

  caja: [
    {
      ...commonStepProps,
      target: "body",
      placement: "center",
      title: "Control de caja",
      content:
        "Aquí abres y cierras tu turno de caja, revisas las ventas del día y consultas el historial de cierres anteriores.",
    },
    {
      ...commonStepProps,
      target: ".caja-header",
      title: "Abrir o cerrar caja",
      content:
        "Usa este botón para abrir tu turno con una base inicial, o para cerrarlo y registrar el resumen de ventas y gastos.",
    },
    {
      ...commonStepProps,
      target: ".caja-historial",
      title: "Historial de cierres",
      content: "Consulta los cierres de caja anteriores, con el detalle de ventas, gastos y saldo neto de cada turno.",
    },
  ],

  reportes: [
    {
      ...commonStepProps,
      target: ".rp-header",
      title: "Reportes",
      content: "Exporta el reporte del período seleccionado a Excel con este botón.",
    },
    {
      ...commonStepProps,
      target: ".rp-filters",
      title: "Rango de fechas",
      content:
        "Elige el período a analizar manualmente o usa los accesos rápidos de 7, 15 o 30 días.",
    },
    {
      ...commonStepProps,
      target: ".rp-kpis",
      title: "Indicadores clave",
      content:
        "Ingresos totales, ticket promedio y la distribución entre pagos en efectivo y por transferencia del período.",
    },
    {
      ...commonStepProps,
      target: ".rp-tabs",
      title: "Detalle del reporte",
      content: "Cambia de vista para analizar las ventas por día, por producto o por categoría.",
    },
  ],

  configuracion: [
    {
      ...commonStepProps,
      target: ".cfg-tabs",
      title: "Configuración",
      content:
        "Gestiona usuarios, los datos del restaurante, entidades bancarias, respaldos e importación de datos desde Excel.",
    },
    {
      ...commonStepProps,
      target: ".cfg-toolbar",
      title: "Nuevo usuario",
      content: "Crea un nuevo usuario del sistema y asígnale un rol y un PIN de acceso.",
    },
    {
      ...commonStepProps,
      target: ".cfg-list",
      title: "Usuarios registrados",
      content: "Edita o elimina usuarios existentes. No puedes eliminar tu propio usuario.",
    },
  ],
};
