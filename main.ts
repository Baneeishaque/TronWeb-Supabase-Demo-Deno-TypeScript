import { loadSync } from "@std/dotenv";
import { TronWeb } from "tronweb";
import { createClient, SupabaseClient, PostgrestError } from "@supabase/supabase-js";

export interface TronWallet {
  address: {
    base58: string;
    hex: string;
  };
  privateKey: string;
  publicKey: string;
}

async function createTronWallet(): Promise<TronWallet> {

  try {

    loadSync({ export: true });

    const tronNetwork: string | undefined = Deno.env.get("TRON_NETWORK");
    if (tronNetwork) {

      // console.log(tronNetwork);
      const adminPrivateKey: string | undefined = Deno.env.get("ADMIN_PRIVATE_KEY");
      if (adminPrivateKey) {

        // console.log(adminPrivateKey);

        try {

          const tronWeb: TronWeb = new TronWeb(
            tronNetwork,
            tronNetwork,
            tronNetwork,
            adminPrivateKey,
          );
          // console.log(tronWeb);

          try {

            return await tronWeb.createAccount();

          } catch (error: unknown) {

            throw new Error(`Error: Failed to create account. ${JSON.stringify(error)}`);
          }

        } catch (error: unknown) {

          throw new Error(`Error: Failed to create TronWeb instance. ${JSON.stringify(error)}`);
        }

      } else {

        throw new Error('ADMIN_PRIVATE_KEY is not defined in the environment variables.');
      }
    } else {

      throw new Error('TRON_NETWORK is not defined in the environment variables.');
    }

  } catch (error: unknown) {

    if (error instanceof Deno.errors.NotFound) {

      throw new Error(`Error: The file does not exist at the specified path. ${error.cause}`);

    } else if (error instanceof Deno.errors.PermissionDenied) {

      throw new Error(`Error: Permission denied to read the file at the specified path. ${error.cause}`);

    } else if (error instanceof SyntaxError) {

      throw new Error(`Error: Invalid syntax in the .env file. ${error.message}`);

    } else {

      throw new Error(`Error: Failed to parse the .env file. ${JSON.stringify(error)}`);
    }
  }
}

export async function createUser(): Promise<void> {

  const tronWallet: TronWallet = await createTronWallet();
  console.log(tronWallet);

  const supabaseUrl: string | undefined = Deno.env.get("SUPABASE_URL");
  if (supabaseUrl) {

    // console.log(supabaseUrl);

    const supabaseAnonKey: string | undefined = Deno.env.get("SUPABASE_ANON_KEY");
    if (supabaseAnonKey) {

      // console.log(supabaseAnonKey);

      try {
        const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

        const { error }: { error: PostgrestError | null } = await supabase
          .from("user")
          .insert([
            {
              email: 'test@test.com',
              password: 'test',
              wallet_address: tronWallet.address.base58,
              private_key: tronWallet.privateKey,
            },
          ]);
        if (error) {

          throw new Error(`Supabase data insertion error : ${JSON.stringify(error)}`);
        }

      } catch (error: unknown) {

        throw new Error(`Supabase Error: ${JSON.stringify(error)}`);
      }
    }
    else {

      throw new Error('SUPABASE_ANON_KEY is not defined in the environment variables.');
    }
  } else {

    throw new Error('SUPABASE_URL is not defined in the environment variables.');
  }
}


if (import.meta.main) {

  createUser().then(() => {
    console.log('User created');
  }).catch((error: unknown) => {
    console.error(error);
  })
}
