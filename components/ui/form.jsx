import * as React from "react";

function Form({ className, ...props }) {
  return <form className={className} {...props} />;
}

function FormField({ children, className }) {
  return <div className={className}>{children}</div>;
}

export { Form, FormField };
