-- Muninn: tabela nova nasce fechada.
-- A 004 tirou o excesso das 6 tabelas que já existiam. Mas, com a opção "expor tabelas
-- automaticamente", os default privileges do schema public ainda dariam TUDO pra anon e
-- authenticated em qualquer tabela, view ou sequence criada depois.
-- A partir daqui, cada migration concede explicitamente o que a tabela nova precisa.
-- Funções ficam de fora: as políticas de RLS chamam funções (is_dm etc.) com o papel de
-- quem consulta, então elas continuam executáveis por padrão.

alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
