/**
 * Stockage local sur le téléphone (version de test, avant le branchement de l'API en phase 1).
 * Aucune donnée de démonstration : tout ce qui s'affiche a été saisi dans l'app.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Grade, Subject } from "@educationplus/shared";

export interface Account {
  name: string;
  phone: string;
  createdAt: string;
}

export interface Child {
  id: string;
  firstName: string;
  grade: Grade;
  createdAt: string;
}

export interface CourseRequestLocal {
  id: string;
  childId: string;
  grade: Grade;
  subjects: Subject[];
  neighbourhood: string;
  city: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  startDate: string;
  durationMonths: number;
  status: "OPEN";
  createdAt: string;
}

interface State {
  account: Account | null;
  children: Child[];
  requests: CourseRequestLocal[];
}

const KEY = "educationplus/state/v1";
const EMPTY: State = { account: null, children: [], requests: [] };

interface Store extends State {
  ready: boolean;
  signUp(a: Omit<Account, "createdAt">): Promise<void>;
  addChild(c: Pick<Child, "firstName" | "grade">): Promise<Child>;
  removeChild(id: string): Promise<void>;
  addRequest(r: Omit<CourseRequestLocal, "id" | "status" | "createdAt">): Promise<void>;
  signOut(): Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ ...EMPTY, ...(JSON.parse(raw) as State) });
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  const save = useCallback(async (next: State) => {
    setState(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const store = useMemo<Store>(
    () => ({
      ...state,
      ready,
      async signUp(a) {
        await save({ ...state, account: { ...a, createdAt: new Date().toISOString() } });
      },
      async addChild(c) {
        const child: Child = { ...c, id: randomUUID(), createdAt: new Date().toISOString() };
        await save({ ...state, children: [...state.children, child] });
        return child;
      },
      async removeChild(id) {
        await save({
          ...state,
          children: state.children.filter((c) => c.id !== id),
          requests: state.requests.filter((r) => r.childId !== id),
        });
      },
      async addRequest(r) {
        const req: CourseRequestLocal = { ...r, id: randomUUID(), status: "OPEN", createdAt: new Date().toISOString() };
        await save({ ...state, requests: [req, ...state.requests] });
      },
      async signOut() {
        await AsyncStorage.removeItem(KEY);
        setState(EMPTY);
      },
    }),
    [state, ready, save],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore doit être utilisé dans StoreProvider");
  return s;
}
