"use client";

import { useState } from "react";
import SearchableSelect, { type ChoiceOption } from "./SearchableSelect";

/** A SearchableSelect inside a plain GET form (a server page): it keeps its own value and sends it under `name`. */
export default function FormChoice(props: {
  name: string;
  defaultValue: string;
  options: ChoiceOption[];
  label: string;
  labelHidden?: boolean;
  selectClassName?: string;
  triggerClassName?: string;
}) {
  const { defaultValue, ...rest } = props;
  const [value, setValue] = useState(defaultValue);
  return <SearchableSelect {...rest} value={value} onChange={setValue} />;
}
