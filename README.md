# Battery digital twin research prototype

This repository implements **Phase 1 of a proposed battery digital twin**: a cyclic-voltammetry (CV) data and quality layer. It accepts an ordered CV sweep, checks whether the sweep supports its reported descriptors, and explains when peak measurements are withheld. The team reports that the supplied 21-point trace contains values from a real experiment. The Random Forest training table is synthetic and is kept for audit; the live app does not claim validated SoH or RUL prediction.

Start with [the research explanation](research/RESEARCH_EXPLAINED.md), then use the [research README](research/README.md) for reproducible analysis and the [figure catalog](research/FIGURE_CATALOG.md) for PNG/PDF graphs. [Experimental metadata](research/experimental_metadata.json) separates recorded facts from the team's unverified account and provisional assumptions.

## Check the implementation

```bash
npm install
npm run check
npm run test:sensor
npm run build
python research/cv_sensor_study.py
python research/synthetic_data_audit.py
python -m pip install -r research/figure_requirements.txt
python research/generate_conference_figures.py
```

The figure generator writes 14 graph/diagram pairs under `research/conference_figures/`. Its model scores are audits of generated rows, not physical-battery validation. The scientific interpretation and remaining evidence requirements are documented in the research files.
