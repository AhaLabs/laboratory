import { Contract } from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";
import { useQuery } from "@tanstack/react-query";

export type ContractInfo = {
  contract: string;
  created: number;
  creator: string;
  description: string;
  wasm: string;
  storage_entries?: number;
};

export const useContractInfoFromRpc = ({
  contractId,
  networkPassphrase,
  rpcUrl,
}: {
  contractId: string;
  networkPassphrase: string;
  rpcUrl: string;
}) => {
  const query = useQuery<ContractInfo | null>({
    queryKey: ["useContractInfoFromRpc", contractId, networkPassphrase, rpcUrl],
    queryFn: async () => {
      try {
        const server = new Server(rpcUrl, { allowHttp: true });

        const contractLedgerKey = new Contract(contractId).getFootprint();
        const response = await server.getLedgerEntries(contractLedgerKey);
        if (!response.entries.length || !response.entries[0]?.val) {
          throw new Error(`No entries found for contract ${contractId}`);
        }
        const wasmHash = response.entries[0].val
          .contractData()
          .val()
          .instance()
          .executable()
          .wasmHash()
          .toString("hex");

        return {
          contract: contractId,
          created: 0,
          creator: "",
          description: "",
          wasm: wasmHash,
          storage_entries: response.entries.length,
        } as ContractInfo;
      } catch (e: any) {
        let customMessage = e?.message || e;
        if (e.message.includes("Cannot destructure property 'length' of 'e'")) {
          customMessage = "There is no Wasm for this contract";
        }
        throw new Error(
          `error while fetching contract information: ${customMessage}`,
        );
      }
    },
    enabled: false,
  });

  return query;
};
