type PageTitleProps = {
  title: string;
  subtitle?: string;
};

export default function PageTitle({
  title,
  subtitle,
}: PageTitleProps) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-slate-900">
        {title}
      </h1>

      {subtitle && (
        <p className="mt-2 text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}