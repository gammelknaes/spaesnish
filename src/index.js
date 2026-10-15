
import { Conjugator } from "@jirimracek/conjugate-esp";

const conjugator = new Conjugator("2010");

const TENSES = {
  presente: ["Indicativo", "Presente"],
  indefinido: ["Indicativo", "PreteritoIndefinido"],
  imperfecto: ["Indicativo", "PreteritoImperfecto"],
  futuro: ["Indicativo", "FuturoImperfecto"],
  condicional: ["Indicativo", "CondicionalSimple"],

  preterito_perfecto: ["Indicativo", "PreteritoPerfecto"],
  pluscuamperfecto: ["Indicativo", "PreteritoPluscuamperfecto"],
  preterito_anterior: ["Indicativo", "PreteritoAnterior"],
  futuro_perfecto: ["Indicativo", "FuturoPerfecto"],
  condicional_compuesto: ["Indicativo", "CondicionalCompuesto"],

  presente_subjuntivo: ["Subjuntivo", "Presente"],
  imperfecto_subjuntivo_ra: ["Subjuntivo", "PreteritoImperfectoRa"],
  imperfecto_subjuntivo_se: ["Subjuntivo", "PreteritoImperfectoSe"],
  futuro_subjuntivo: ["Subjuntivo", "FuturoImperfecto"],
  preterito_perfecto_subjuntivo: ["Subjuntivo", "PreteritoPerfecto"],
  pluscuamperfecto_subjuntivo_ra: [
    "Subjuntivo", "PreteritoPluscuamperfectoRa"
  ],
  pluscuamperfecto_subjuntivo_se: [
    "Subjuntivo", "PreteritoPluscuamperfectoSe"
  ],
  futuro_perfecto_subjuntivo: ["Subjuntivo", "FuturoPerfecto"],

  imperativo_afirmativo: ["Imperativo", "Afirmativo"],
  imperativo_negativo: ["Imperativo", "Negativo"]
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== "GET") {
      return json({ ok: false, error: "GET 요청만 지원합니다." }, 405);
    }

    const verb = (url.searchParams.get("verb") || "")
      .trim().toLowerCase();
    const tense = (url.searchParams.get("tense") || "")
      .trim().toLowerCase();

    if (!verb || !tense) {
      return json({
        ok: true,
        message: "동사와 시제를 입력하세요.",
        example: "?verb=tener&tense=presente"
      });
    }

    if (!TENSES[tense]) {
      return json({
        ok: false,
        error: "지원하지 않는 시제 코드입니다.",
        supportedTenses: Object.keys(TENSES)
      }, 400);
    }

    try {
      const results = conjugator.conjugateSync(verb, "castellano");

      if (typeof results === "string" || !Array.isArray(results) ||
          results.length === 0) {
        return json({
          ok: false,
          error: typeof results === "string"
            ? results
            : "활용 결과를 찾지 못했습니다.",
          verb,
          tense
        }, 422);
      }

      // 엔진이 제공하는 첫 번째 활용표를 사용한다.
      const result = results[0];
      const [mood, tenseName] = TENSES[tense];
      const forms = result.conjugation?.[mood]?.[tenseName];

      if (!Array.isArray(forms) || forms.length !== 6) {
        return json({
          ok: false,
          error: "해당 시제의 6인칭 활용표를 확인할 수 없습니다.",
          verb,
          tense
        }, 422);
      }

      return json({
        ok: true,
        verb,
        tense,
        region: "castellano",
        model: result.info?.model || "",
        variantCount: results.length,
        defective: result.info?.["defective?"] === true,
        forms
      });
    } catch (error) {
      return json({
        ok: false,
        error: String(error.message || error),
        verb,
        tense
      }, 500);
    }
  }
};

