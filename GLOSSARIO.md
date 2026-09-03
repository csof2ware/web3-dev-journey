# 📚 Glossário Web3 Completo

## Fundamentos
- *Blockchain*: livro-razão append-only replicado entre nós; histórico imutável de transações.
- *Bloco*: pacote de transações com hash do bloco anterior (daí "corrente").
- *Hash*: função determinística de sentido único (keccak256 no Ethereum).
- *Merkle Tree*: árvore de hashes; prova inclusão em O(log n) com 32 bytes por nível.
- *Merkle Root / Proof*: resumo da árvore / caminho de verificação de um item.
- *Nonce*: número usado uma vez (anti-replay em txs, provas ZK e vouchers).
- *Gas*: unidade de custo computacional; paga execução na EVM.
- *Wei / Gwei*: 10^-18 e 10^-9 ETH.
- *Consenso*: regra de acordo entre nós (PoW, PoS, PoA).
- *PoW*: prova de trabalho (Bitcoin) — segurança por energia.
- *PoS*: prova de participação (Ethereum) — segurança por capital travado.
- *PoA*: prova de autoridade — validadores identificados, chains privadas/testnet.
- *BFT*: tolerância a falhas bizantinas — consenso com nós maliciosos.
- *Finalidade (finality)*: ponto em que uma tx não pode mais ser revertida.
- *Imutabilidade*: histórico não editável; correção só por nova tx.
- *Trustless*: não depende de confiança em intermediário, só de criptografia/incentivos.
- *Permissionless*: qualquer um pode participar sem autorização.
- *Resistência a censura*: ninguém impede txs válidas.
- *Oráculo*: ponte de dados off-chain → on-chain (Chainlink).
- *Chain ID*: identificador de rede (1 mainnet, 31337 hardhat, 80002 amoy).
- *Mainnet / Testnet*: rede real com valor / rede de teste (Amoy, Sepolia).
- *Fork*: cópia/divergência de chain ou de código.

## Contas, Assinaturas e Transações
- *EOA*: conta de pessoa (par chave privada/pública).
- *Conta de contrato*: código executável com endereço próprio.
- *Chave privada / pública*: segredo que assina / deriva endereço.
- *Seed phrase*: 12/24 palavras que regeneram todas as chaves (BIP-39).
- *Mempool*: sala de espera de txs não mineradas.
- *ECDSA*: algoritmo de assinatura (secp256k1 no Ethereum).
- *EIP-712*: assinatura de dados tipados e legíveis (UX segura na wallet).
- *Replay protection*: domain separator + nonce impedem reuso de assinatura.
- *Account Abstraction (ERC-4337)*: contas viram contratos: gasless, batch, recovery.
- *Paymaster*: contrato que paga gas pelo usuário.
- *Bundler*: empacota UserOperations em txs (ERC-4337).
- *UserOperation*: "pseudo-transação" da account abstraction.
- *Multisig*: conta controlada por M-de-N chaves (Safe).
- *Social recovery*: recuperar conta via guardiões, sem seed.
- *EIP-1559*: base fee queimada + priority fee (gorjeta).
- *Fee burn*: queima de ETH (deflacionário em alta demanda).

## Tokens e Padrões
- *Fungível*: intercambiável (1 ETH = 1 ETH).
- *Não-fungível*: único e indivisível (NFT).
- *ERC-20*: token fungível padrão.
- *ERC-721*: NFT clássico.
- *ERC-1155*: multi-token (fungíveis + NFTs num contrato; batch = menos gas).
- *ERC-2612 (permit)*: approve por assinatura, sem tx de approve.
- *EIP-2981*: royalties de NFT padronizados.
- *Token URI / metadata*: ponteiro (geralmente IPFS) para nome/imagem/atributos.
- *Mint / Burn*: criar / destruir tokens.
- *Allowance + approve/transferFrom*: permissão de gasto de terceiros.
- *Soulbound token*: NFT intransferível (identidade/reputação).
- *Wrapped token*: representação 1:1 de outro ativo (wETH).

## DeFi
- *DEX*: exchange descentralizada (Uniswap).
- *AMM*: formador de mercado automático (x*y=k).
- *Liquidity Pool*: fundos depositados que habilitam swaps.
- *LP token*: recibo da posição de liquidez.
- *Slippage*: diferença entre preço esperado e executado.
- *Impermanent loss*: perda relativa de prover liquidez vs segurar ativos.
- *Staking*: travar tokens para segurança/recompensa.
- *Restaking*: reutilizar ETH stakeado como segurança de outros protocolos (EigenLayer).
- *Lending/borrowing*: empréstimo com colateral (Aave, Compound).
- *Liquidação*: venda do colateral quando saúde da dívida cai.
- *TVL*: valor total travado no protocolo.
- *Stablecoin*: token pareado a dólar (USDC, DAI).
- *Flash loan*: empréstimo sem colateral dentro de UMA tx.
- *Arbitragem*: lucro de diferença de preço entre mercados.
- *MEV*: valor extraível por ordenar/incluir txs.
- *Front-running*: copiar sua tx na frente pagando mais gas.
- *Sandwich*: comprar antes e vender depois da sua swap.
- *PBS / block builder*: separação proposer-builder (mitiga MEV).
- *Private mempool*: txs invisíveis até inclusão (Flashbots Protect).

## Escala (L2s e além)
- *L1*: chain base (Ethereum).
- *L2*: camada que herda segurança da L1 (rollups).
- *Optimistic rollup*: assume válido, janela de fraude (Optimism, Arbitrum).
- *ZK-rollup*: prova de validade matemática (zkSync, Starknet).
- *Fraud proof vs validity proof*: desafio pós-hoc vs prova imediata.
- *SNARK/STARK*: provas sucintas de conhecimento zero.
- *DA (data availability)*: garantia de que os dados das txs existem.
- *Sequencer*: ordenador de txs do L2.
- *Bridge*: ponte entre chains (risco nº 1 de hacks históricos).
- *Sidechain*: chain paralela com segurança própria (Polygon PoS).
- *TPS / block time*: throughput e cadência de blocos.
- *EVM*: máquina virtual do Ethereum; "EVM-compatible" roda bytecode Solidity.

## Segurança
- *Reentrancy*: chamar de volta antes de atualizar estado (DAO hack).
- *Checks-effects-interactions*: padrão anti-reentrância.
- *Oracle manipulation*: distorcer preço de oráculo (flash loans).
- *Access control*: onlyOwner/roles; causa nº 1 de exploits quando falha.
- *Proxy upgradable (UUPS/transparent)*: contrato com lógica trocável.
- *Timelock*: atraso entre aprovação e execução (janela de fuga).
- *Auditoria*: revisão profissional de código (Trail of Bits, OZ).
- *Fuzzing / invariant testing*: entradas aleatórias + propriedades que nunca quebram.
- *Static analysis*: slither, mythril — bugs sem rodar código.
- *Bug bounty*: recompensa por vulnerabilidades (Immunefi).
- *Rug pull*: time some com a liquidez.
- *Honeypot*: contrato que deixa comprar mas não vender.
- *Sybil attack*: um ator finge ser milhares.
- *51% attack*: maioria de hash/stake reescreve histórico.
- *Slashing*: punição com perda de stake por mau comportamento.

## Governança e DAOs
- *DAO*: organização governada por código + votação on-chain.
- *Governance token*: direito de voto (UNI, COMP).
- *Proposal / quórum / timelock*: ciclo de vida de decisão.
- *Delegação*: emprestar voto sem transferir tokens.
- *Snapshot*: votação off-chain assinada (gasless, peso on-chain).
- *Quadratic voting*: custo quadrático = voz mais distribuída.
- *Tesouraria on-chain*: fundos visíveis e controlados por voto.
- *Fork as exit*: discordou? Leve o código e a comunidade embora.
- *Proof-of-personhood*: 1 pessoa = 1 voto (Worldcoin, Gitcoin Passport).

## Infra e DevTools
- *RPC*: interface JSON-RPC com a chain (eth_call, eth_sendRawTransaction).
- *Provider / Signer*: leitura / escrita (ethers.js).
- *ABI*: "interface" do contrato para o mundo externo.
- *Bytecode / opcode*: código compilado / instruções da EVM.
- *Hardhat / Foundry*: frameworks dev+test (JS vs Solidity-native).
- *Anvil / Cast / Forge*: node local, CLI de chamadas, testes Foundry.
- *IPFS / CID*: storage content-addressed; mesmo conteúdo = mesmo CID.
- *Pinning / gateway*: manter dados disponíveis / servir via HTTP.
- *The Graph / subgraph*: indexer declarativo com GraphQL.
- *Archive node*: guarda todo o histórico de estado.
- *Rate limiting / sliding window*: controle de abuso por janela móvel.
- *Healthcheck (liveness/readiness)*: sinais para orquestradores.
- *Prometheus / Grafana*: coleta de métricas / dashboards.
- *CI/CD*: testes e builds automáticos a cada push.
- *Docker / compose*: isolamento e orquestração de ambientes.

## NFTs e Cultura
- *Collection / edition*: série única / múltiplas cópias numeradas.
- *Allowlist / whitelist*: elegibilidade prévia (nosso Merkle!).
- *Reveal*: metadata escondida até o mint fechar.
- *Generative art*: arte combinada algoritmicamente (Art Blocks).
- *PFP*: NFT de avatar/perfil.
- *POAP*: proof-of-attendance (presença como NFT).
- *Floor price*: menor preço de venda de uma coleção.
- *Metadata on-chain vs off-chain*: no contrato vs IPFS/HTTP (trade-off custo/resiliência).

## Tokenomics e Bens Públicos
- *Tokenomics*: emissão, distribuição, queima, incentivos.
- *Vesting / cliff*: liberação gradual de tokens (anti-dump).
- *Airdrop*: distribuição gratuita (growth + descentralização).
- *Quadratic funding*: matching que valoriza nº de apoiadores.
- *RWA*: ativos do mundo real tokenizados (imóveis, títulos).
- *Tragédia dos comuns*: recurso compartilhado sem coordenação colapsa — DAOs e tokens são a resposta programável.
