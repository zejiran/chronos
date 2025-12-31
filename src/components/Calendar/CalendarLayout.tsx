import { Switch, Match } from "solid-js";
import { useStore } from "@nanostores/solid";
import { css } from "../../../styled-system/css";
import { currentView } from "../../stores";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";
import { YearView } from "./YearView";
import { AgendaView } from "./AgendaView";

export function CalendarLayout() {
  const $currentView = useStore(currentView);

  return (
    <div
      class={css({
        flex: 1,
        overflow: "hidden",
        backgroundColor: "background",
      })}
    >
      <Switch fallback={<MonthView />}>
        <Match when={$currentView() === "day"}>
          <DayView />
        </Match>
        <Match when={$currentView() === "week"}>
          <WeekView />
        </Match>
        <Match when={$currentView() === "month"}>
          <MonthView />
        </Match>
        <Match when={$currentView() === "year"}>
          <YearView />
        </Match>
        <Match when={$currentView() === "agenda"}>
          <AgendaView />
        </Match>
      </Switch>
    </div>
  );
}
