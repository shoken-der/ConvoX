export default function Avatar({
  src,
  alt,
  size = 48,
  className = "",
  fallbackUrl,
  ...props
}) {
  return (
    <img
      src={src || fallbackUrl}
      alt={alt || ""}
      width={size}
      height={size}
      className={`object-cover rounded-[18px] ${className}`}
      onError={(e) => {
        if (fallbackUrl) e.currentTarget.src = fallbackUrl;
      }}
      {...props}
    />
  );
}

