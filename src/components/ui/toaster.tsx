import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "!bg-black !border !border-cyan-500/20 !text-cyan-100 !shadow-[0_0_30px_rgba(34,211,238,0.12)]",
          title: "!text-cyan-200",
          description: "!text-slate-300",
          actionButton: "!bg-cyan-600 !text-white",
          cancelButton: "!bg-slate-800 !text-slate-200",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };